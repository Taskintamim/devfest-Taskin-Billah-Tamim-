import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { LANGUAGE_KEY, MAX_FILES, MAX_TOTAL_BYTES } from "../lib/constants";
import { duplicateMap, sha256Hex } from "../lib/hash";
import { t } from "../lib/i18n";
import { requirementTitle } from "../lib/format";
import { errorKeyForParse, parseRequirementsPayload } from "../lib/parseRequirements";
import { readPdfPageCount } from "../lib/pdf";
import { buildSuggestions } from "../lib/suggest";
import { evaluatePackage, matchedHashSet } from "../lib/status";
import { buildPackagePdf, triggerDownload } from "../lib/packagePdf";

const IDLE_GENERATION = {
  phase: "idle",
  result: null,
  error: null,
  overlay: false,
};

const BUSY_PHASES = new Set(["preparing", "processing", "finalizing"]);

function keepOrResetGeneration(state) {
  if (BUSY_PHASES.has(state.generation.phase)) return state.generation;
  return IDLE_GENERATION;
}

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
  generation: IDLE_GENERATION,
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
        generation: IDLE_GENERATION,
      };
    case "ADD_FILES":
      return { ...state, files: [...state.files, ...action.files], generation: keepOrResetGeneration(state) };
    case "UPDATE_FILE": {
      let nextMatches = state.matches;
      if (action.patch.status === "invalid") {
        nextMatches = { ...state.matches };
        for (const [requirementId, fileId] of Object.entries(nextMatches)) {
          if (fileId === action.id) delete nextMatches[requirementId];
        }
      }
      return {
        ...state,
        files: state.files.map((file) => (file.id === action.id ? { ...file, ...action.patch } : file)),
        matches: nextMatches,
      };
    }
    case "REMOVE_FILE": {
      const nextMatches = { ...state.matches };
      for (const [requirementId, fileId] of Object.entries(nextMatches)) {
        if (fileId === action.id) delete nextMatches[requirementId];
      }
      return {
        ...state,
        files: state.files.filter((file) => file.id !== action.id),
        matches: nextMatches,
        generation: keepOrResetGeneration(state),
      };
    }
    case "CLEAR_FILES":
      return { ...state, files: [], matches: {}, expiryDates: {}, generation: IDLE_GENERATION };
    case "SET_MATCH": {
      const nextMatches = { ...state.matches };
      for (const [requirementId, fileId] of Object.entries(nextMatches)) {
        if (fileId === action.fileId) delete nextMatches[requirementId];
      }
      nextMatches[action.requirementId] = action.fileId;
      return { ...state, matches: nextMatches, generation: keepOrResetGeneration(state) };
    }
    case "UNMATCH": {
      const nextMatches = { ...state.matches };
      delete nextMatches[action.requirementId];
      return { ...state, matches: nextMatches, generation: keepOrResetGeneration(state) };
    }
    case "SET_EXPIRY": {
      const nextExpiry = { ...state.expiryDates };
      if (action.value) nextExpiry[action.requirementId] = action.value;
      else delete nextExpiry[action.requirementId];
      return { ...state, expiryDates: nextExpiry, generation: keepOrResetGeneration(state) };
    }
    case "APPLY_MATCHES": {
      const nextMatches = { ...state.matches };
      for (const item of action.items) {
        for (const [requirementId, fileId] of Object.entries(nextMatches)) {
          if (fileId === item.fileId) delete nextMatches[requirementId];
        }
        nextMatches[item.requirementId] = item.fileId;
      }
      return { ...state, matches: nextMatches, generation: keepOrResetGeneration(state) };
    }
    case "GEN_START":
      return { ...state, generation: { ...IDLE_GENERATION, phase: "preparing" } };
    case "GEN_PHASE":
      return { ...state, generation: { ...state.generation, phase: action.phase } };
    case "GEN_SUCCESS":
      return {
        ...state,
        generation: { phase: "success", result: action.result, error: null, overlay: true },
      };
    case "GEN_ERROR":
      return {
        ...state,
        generation: { ...state.generation, phase: "error", error: action.error, overlay: false },
      };
    case "GEN_DISMISS":
      return { ...state, generation: { ...state.generation, overlay: false } };
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
  const matchesRef = useRef(state.matches);
  matchesRef.current = state.matches;

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
            if (bytes.byteLength === 0) {
              dispatch({
                type: "UPDATE_FILE",
                id: item.id,
                patch: { status: "invalid", error: "unreadable", bytes, hash: null, pageCount: null },
              });
              return;
            }
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

  const matchFile = useCallback(
    (requirementId, fileId) => {
      const lang = state.language;
      const files = filesRef.current;
      const matches = matchesRef.current;
      const file = files.find((item) => item.id === fileId);
      if (!file || file.status !== "ready" || !file.hash) {
        pushToast("danger", t(lang, "errorFileNotUsable"));
        return false;
      }
      const blockedHashes = matchedHashSet(files, matches, requirementId);
      if (blockedHashes.has(file.hash)) {
        const ownerId = Object.entries(matches).find(([, id]) => {
          const owner = files.find((item) => item.id === id);
          return owner?.hash === file.hash;
        })?.[0];
        const ownerFile = files.find((item) => item.id === matches[ownerId]);
        const ownerReq = state.requirements.find((item) => item.id === ownerId);
        pushToast(
          "danger",
          t(lang, "errorDuplicateMatch", {
            file: ownerFile?.name || file.name,
            doc: requirementTitle(ownerReq, lang) || ownerId,
          }),
        );
        return false;
      }
      const previousReqId = Object.entries(matches).find(([reqId, id]) => id === fileId && reqId !== requirementId)?.[0];
      dispatch({ type: "SET_MATCH", requirementId, fileId });
      if (previousReqId) {
        const previousReq = state.requirements.find((item) => item.id === previousReqId);
        pushToast("ok", t(lang, "matchMoved", { name: requirementTitle(previousReq, lang) || previousReqId }));
      }
      return true;
    },
    [pushToast, state.language, state.requirements],
  );

  const unmatchFile = useCallback((requirementId) => {
    dispatch({ type: "UNMATCH", requirementId });
  }, []);

  const setExpiry = useCallback((requirementId, value) => {
    dispatch({ type: "SET_EXPIRY", requirementId, value });
  }, []);

  const applySuggestions = useCallback((items) => {
    if (!items?.length) return;
    dispatch({ type: "APPLY_MATCHES", items });
  }, []);

  const snapshotRef = useRef(state);
  snapshotRef.current = state;
  const generatingRef = useRef(false);
  const lastUrlRef = useRef(null);

  const requestGenerate = useCallback(async () => {
    if (generatingRef.current) return;
    const { language, tender, requirements, files, matches, expiryDates } = snapshotRef.current;
    const current = evaluatePackage({ tender, requirements, files, matches, expiryDates });
    if (!current.ready) {
      pushToast("danger", t(language, "errorNotReady"));
      return;
    }

    generatingRef.current = true;
    dispatch({ type: "GEN_START" });
    try {
      const built = await buildPackagePdf(
        { tender, requirements, files, matches, expiryDates },
        (phase) => dispatch({ type: "GEN_PHASE", phase }),
      );
      const downloaded = triggerDownload(built.bytes, built.filename);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = downloaded.url;
      dispatch({
        type: "GEN_SUCCESS",
        result: {
          filename: built.filename,
          pages: built.pages,
          documents: built.documents,
          bytes: built.bytes,
          url: downloaded.url,
        },
      });
    } catch (error) {
      const key =
        error?.message === "not-ready"
          ? "errorNotReady"
          : error?.message === "no-documents"
            ? "errorNoDocuments"
            : error?.message === "missing-bytes"
              ? "errorMissingBytes"
              : "errorGenerateGeneric";
      const message = t(language, key);
      dispatch({ type: "GEN_ERROR", error: message });
      pushToast("danger", message);
    } finally {
      generatingRef.current = false;
    }
  }, [pushToast]);

  const downloadPackage = useCallback(() => {
    const result = snapshotRef.current.generation.result;
    if (!result?.bytes || !result.filename) return;
    const downloaded = triggerDownload(result.bytes, result.filename);
    if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
    lastUrlRef.current = downloaded.url;
  }, []);

  const dismissGeneration = useCallback(() => {
    dispatch({ type: "GEN_DISMISS" });
  }, []);

  const duplicates = useMemo(() => duplicateMap(state.files), [state.files]);

  const validation = useMemo(
    () =>
      evaluatePackage({
        tender: state.tender,
        requirements: state.requirements,
        files: state.files,
        matches: state.matches,
        expiryDates: state.expiryDates,
      }),
    [state.tender, state.requirements, state.files, state.matches, state.expiryDates],
  );

  const hashBlockSet = useMemo(
    () => matchedHashSet(state.files, state.matches, null),
    [state.files, state.matches],
  );

  const suggestions = useMemo(
    () =>
      buildSuggestions({
        files: state.files,
        requirements: state.requirements,
        matches: state.matches,
        matchedHashes: hashBlockSet,
      }),
    [state.files, state.requirements, state.matches, hashBlockSet],
  );

  const value = useMemo(
    () => ({
      ...state,
      duplicates,
      validation,
      suggestions,
      setLanguage,
      loadRequirementsFile,
      addFiles,
      removeFile,
      clearFiles,
      matchFile,
      unmatchFile,
      setExpiry,
      applySuggestions,
      requestGenerate,
      downloadPackage,
      dismissGeneration,
      pushToast,
      dismissToast,
    }),
    [
      state,
      duplicates,
      validation,
      suggestions,
      setLanguage,
      loadRequirementsFile,
      addFiles,
      removeFile,
      clearFiles,
      matchFile,
      unmatchFile,
      setExpiry,
      applySuggestions,
      requestGenerate,
      downloadPackage,
      dismissGeneration,
      pushToast,
      dismissToast,
    ],
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
