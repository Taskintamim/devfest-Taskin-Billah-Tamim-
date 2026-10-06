import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { LANGUAGE_KEY, MAX_FILES, MAX_TOTAL_BYTES } from "../lib/constants";
import { duplicateMap, sha256Hex } from "../lib/hash";
import { t } from "../lib/i18n";
import { errorKeyForParse, parseRequirementsPayload } from "../lib/parseRequirements";
import { readPdfPageCount } from "../lib/pdf";

const AppContext = createContext(null);

function readStoredLanguage() {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    return stored === "bn" ? "bn" : "en";
  } catch {
    return "en";
  }
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `f_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const initialState = {
  language: readStoredLanguage(),
  tender: null,
  requirements: [],
  files: [],
  matches: {},
  expiryDates: {},
  toasts: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_LANGUAGE":
      return { ...state, language: action.language };
    case "LOAD_TENDER":
      return {
        ...state,
        tender: action.tender,
        requirements: action.requirements,
        matches: {},
        expiryDates: {},
      };
    case "ADD_FILES":
      return { ...state, files: [...state.files, ...action.files] };
    case "UPDATE_FILE":
      return {
        ...state,
        files: state.files.map((file) => (file.id === action.id ? { ...file, ...action.patch } : file)),
      };
    case "REMOVE_FILE": {
      const nextMatches = { ...state.matches };
      for (const [requirementId, fileId] of Object.entries(nextMatches)) {
        if (fileId === action.id) delete nextMatches[requirementId];
      }
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
        matches: nextMatches,
      };
    }
    case "CLEAR_FILES":
      return { ...state, files: [], matches: {}, expiryDates: {} };
    case "PUSH_TOAST":
      return { ...state, toasts: [...state.toasts.slice(-4), action.toast] };
    case "DISMISS_TOAST":
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) };
    default:
      return state;
  }
}

function isPdfFile(file) {
  const name = (file.name || "").toLowerCase();
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const filesRef = useRef(state.files);
  filesRef.current = state.files;

  useEffect(() => {
    document.documentElement.lang = state.language;
    try {
      localStorage.setItem(LANGUAGE_KEY, state.language);
    } catch {
      /* ignore private-mode storage failures */
    }
  }, [state.language]);

  const setLanguage = useCallback((language) => {
    dispatch({ type: "SET_LANGUAGE", language });
  }, []);

  const pushToast = useCallback((tone, message) => {
    const id = createId();
    dispatch({
      type: "PUSH_TOAST",
      toast: { id, tone, message },
    });
    window.setTimeout(() => {
      dispatch({ type: "DISMISS_TOAST", id });
    }, 4200);
  }, []);

  const dismissToast = useCallback((id) => {
    dispatch({ type: "DISMISS_TOAST", id });
  }, []);

  const loadRequirementsFile = useCallback(
    async (file) => {
      const lang = state.language;
      if (!file) return;
      let text;
      try {
        text = await file.text();
      } catch {
        pushToast("danger", t(lang, "errorRequirementsInvalid"));
        return;
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        pushToast("danger", t(lang, "errorJsonInvalid"));
        return;
      }

      try {
        const parsed = parseRequirementsPayload(data);
        dispatch({
          type: "LOAD_TENDER",
          tender: parsed.tender,
          requirements: parsed.requirements,
        });
        pushToast("ok", t(lang, "tenderLoaded"));
      } catch (error) {
        pushToast("danger", t(lang, errorKeyForParse(error)));
      }
    },
    [pushToast, state.language],
  );

  const addFiles = useCallback(
    async (incoming) => {
      const lang = state.language;
      const list = Array.from(incoming || []);
      if (list.length === 0) return;

      const nonPdf = list.filter((file) => !isPdfFile(file));
      const pdfs = list.filter((file) => isPdfFile(file));

      for (const file of nonPdf) {
        pushToast("danger", t(lang, "errorNotPdf", { name: file.name }));
      }

      if (pdfs.length === 0) return;

      const currentFiles = filesRef.current;
      const remainingSlots = MAX_FILES - currentFiles.length;
      if (remainingSlots <= 0) {
        pushToast("danger", t(lang, "errorMaxFiles"));
        return;
      }

      const accepted = [];
      let skippedForCount = 0;
      let skippedForSize = 0;
      let used = currentFiles.reduce((sum, file) => sum + file.size, 0);

      for (const file of pdfs) {
        if (accepted.length >= remainingSlots) {
          skippedForCount += 1;
          continue;
        }
        if (used + file.size > MAX_TOTAL_BYTES) {
          skippedForSize += 1;
          continue;
        }
        used += file.size;
        accepted.push(file);
      }

      if (skippedForCount > 0) pushToast("danger", t(lang, "errorMaxFiles"));
      if (skippedForSize > 0) pushToast("danger", t(lang, "errorMaxSize"));

      if (accepted.length === 0) return;

      const staged = accepted.map((file) => ({
        id: createId(),
        name: file.name,
        size: file.size,
        bytes: null,
        hash: null,
        pageCount: null,
        status: "processing",
        error: null,
        blob: file,
      }));

      dispatch({ type: "ADD_FILES", files: staged });

      await Promise.all(
        staged.map(async (item) => {
          try {
            const buffer = await item.blob.arrayBuffer();
            const bytes = new Uint8Array(buffer);
            const hash = await sha256Hex(bytes);

            let pageCount = null;
            let status = "ready";
            let error = null;
            try {
              pageCount = await readPdfPageCount(bytes);
            } catch {
              status = "invalid";
              error = "unreadable";
            }

            dispatch({
              type: "UPDATE_FILE",
              id: item.id,
              patch: {
                bytes,
                hash,
                pageCount,
                status,
                error,
                blob: item.blob,
              },
            });
          } catch {
            dispatch({
              type: "UPDATE_FILE",
              id: item.id,
              patch: {
                status: "invalid",
                error: "unreadable",
              },
            });
          }
        }),
      );
    },
    [pushToast, state.language],
  );

  const removeFile = useCallback((id) => {
    dispatch({ type: "REMOVE_FILE", id });
  }, []);

  const clearFiles = useCallback(() => {
    dispatch({ type: "CLEAR_FILES" });
  }, []);

  const duplicates = useMemo(() => duplicateMap(state.files), [state.files]);

  const value = useMemo(
    () => ({
      ...state,
      duplicates,
      setLanguage,
      loadRequirementsFile,
      addFiles,
      removeFile,
      clearFiles,
      pushToast,
      dismissToast,
    }),
    [state, duplicates, setLanguage, loadRequirementsFile, addFiles, removeFile, clearFiles, pushToast, dismissToast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used within AppProvider");
  }
  return value;
}
