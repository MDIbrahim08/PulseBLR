/**
 * PulseObserver — Global Observability Store
 *
 * This is the single source of truth for ArmorIQ.
 * Every agent, API call, and AI router event writes here.
 * ArmorIQ reads from here. Zero duplicate API calls.
 */
import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────

export type AgentStatus = 'idle' | 'fetching' | 'success' | 'failed';
export type APIStatus = 'online' | 'offline' | 'retrying' | 'cached';
export type ProviderName = 'Gemini' | 'Groq' | 'Groq Fallback' | 'OpenRouter' | 'None';
export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface AgentState {
  status: AgentStatus;
  latency: number | null;     // ms
  lastUpdated: Date | null;
  error: string | null;
}

export interface APIState {
  status: APIStatus;
  latency: number | null;
  lastSync: Date | null;
}

export interface AuditRecord {
  id: string;
  timestamp: Date;
  origin: string;
  destination: string;
  requestedTime: string;
  timeMode: string;
  providerUsed: ProviderName;
  fallbackUsed: boolean;
  responseDurationMs: number;
  confidenceScore: number | null;
  sourcesUsed: string[];
  schemaValid: boolean;
  jsonParsed: boolean;
}

export interface SecurityState {
  promptInjection: 'passed' | 'warning' | 'failed';
  malformedResponse: 'passed' | 'warning' | 'failed';
  schemaValidation: 'passed' | 'warning' | 'failed';
  jsonParsed: 'passed' | 'warning' | 'failed';
  apiAuth: 'passed' | 'warning' | 'failed';
  https: 'passed' | 'warning' | 'failed';
  rateLimiting: 'passed' | 'warning' | 'failed';
}

export interface LogEvent {
  id: string;
  timestamp: Date;
  message: string;
  type: LogType;
  agent?: string;
}

export interface RouterState {
  currentProvider: ProviderName;
  fallbackProvider: ProviderName | null;
  fallbackActivated: boolean;
  lastResponseMs: number | null;
  requestInFlight: boolean;
  totalRequests: number;
  failedRequests: number;
}

// ─── Store Shape ────────────────────────────────────────────────────────────

interface PulseObserverState {
  // Agent health
  agents: Record<string, AgentState>;

  // API health
  apis: Record<string, APIState>;

  // AI Router
  router: RouterState;

  // Recommendation audit log
  auditLog: AuditRecord[];
  latestAudit: AuditRecord | null;

  // Security checks
  security: SecurityState;

  // Live event log
  events: LogEvent[];

  // Auth
  authStatus: 'authenticated' | 'unauthenticated' | 'checking';

  // ── Actions ─────────────────────────────────────────────────────────────

  // Agent actions
  setAgentStatus: (agent: string, status: AgentStatus, latencyMs?: number, error?: string) => void;

  // API actions
  setAPIStatus: (api: string, status: APIStatus, latencyMs?: number) => void;

  // Router actions
  setRouterProvider: (provider: ProviderName, fallback?: ProviderName, fallbackActivated?: boolean) => void;
  setRouterLatency: (ms: number) => void;
  setRouterInFlight: (inFlight: boolean) => void;
  incrementRequests: (failed?: boolean) => void;

  // Audit
  addAuditRecord: (record: Omit<AuditRecord, 'id'>) => void;

  // Security
  updateSecurity: (updates: Partial<SecurityState>) => void;

  // Log
  addEvent: (message: string, type: LogType, agent?: string) => void;

  // Auth
  setAuthStatus: (status: 'authenticated' | 'unauthenticated' | 'checking') => void;
}

// ─── Initial State ──────────────────────────────────────────────────────────

const defaultAgentState = (): AgentState => ({
  status: 'idle',
  latency: null,
  lastUpdated: null,
  error: null,
});

const defaultAPIState = (): APIState => ({
  status: 'online',
  latency: null,
  lastSync: null,
});

const uid = () => Math.random().toString(36).slice(2, 9);

// ─── Store ──────────────────────────────────────────────────────────────────

export const usePulseObserver = create<PulseObserverState>((set, get) => ({
  agents: {
    velocity: defaultAgentState(),
    nimbus: defaultAgentState(),
    transitiq: defaultAgentState(),
    urbansense: defaultAgentState(),
    chronos: defaultAgentState(),
    pulsemind: defaultAgentState(),
  },

  apis: {
    traffic: defaultAPIState(),
    weather: defaultAPIState(),
    metro: defaultAPIState(),
    auth: { status: 'online', latency: null, lastSync: new Date() },
  },

  router: {
    currentProvider: 'None',
    fallbackProvider: null,
    fallbackActivated: false,
    lastResponseMs: null,
    requestInFlight: false,
    totalRequests: 0,
    failedRequests: 0,
  },

  auditLog: [],
  latestAudit: null,

  security: {
    promptInjection: 'passed',
    malformedResponse: 'passed',
    schemaValidation: 'passed',
    jsonParsed: 'passed',
    apiAuth: 'passed',
    https: window.location.protocol === 'https:' ? 'passed' : 'warning',
    rateLimiting: 'passed',
  },

  events: [
    {
      id: uid(),
      timestamp: new Date(),
      message: 'ArmorIQ Security Layer initialized',
      type: 'success',
    },
  ],

  authStatus: 'checking',

  // ── Agent actions ────────────────────────────────────────────────────────
  setAgentStatus: (agent, status, latencyMs, error) =>
    set(state => ({
      agents: {
        ...state.agents,
        [agent]: {
          status,
          latency: latencyMs ?? state.agents[agent]?.latency ?? null,
          lastUpdated: new Date(),
          error: error ?? null,
        },
      },
    })),

  // ── API actions ──────────────────────────────────────────────────────────
  setAPIStatus: (api, status, latencyMs) =>
    set(state => ({
      apis: {
        ...state.apis,
        [api]: {
          status,
          latency: latencyMs ?? state.apis[api]?.latency ?? null,
          lastSync: status === 'online' || status === 'cached' ? new Date() : state.apis[api]?.lastSync ?? null,
        },
      },
    })),

  // ── Router actions ────────────────────────────────────────────────────────
  setRouterProvider: (provider, fallback, fallbackActivated) =>
    set(state => ({
      router: {
        ...state.router,
        currentProvider: provider,
        fallbackProvider: fallback ?? state.router.fallbackProvider,
        fallbackActivated: fallbackActivated ?? state.router.fallbackActivated,
      },
    })),

  setRouterLatency: (ms) =>
    set(state => ({ router: { ...state.router, lastResponseMs: ms } })),

  setRouterInFlight: (inFlight) =>
    set(state => ({ router: { ...state.router, requestInFlight: inFlight } })),

  incrementRequests: (failed = false) =>
    set(state => ({
      router: {
        ...state.router,
        totalRequests: state.router.totalRequests + 1,
        failedRequests: failed ? state.router.failedRequests + 1 : state.router.failedRequests,
      },
    })),

  // ── Audit ────────────────────────────────────────────────────────────────
  addAuditRecord: (record) => {
    const full: AuditRecord = { ...record, id: uid() };
    set(state => ({
      auditLog: [full, ...state.auditLog].slice(0, 50),
      latestAudit: full,
    }));
  },

  // ── Security ─────────────────────────────────────────────────────────────
  updateSecurity: (updates) =>
    set(state => ({ security: { ...state.security, ...updates } })),

  // ── Event log ────────────────────────────────────────────────────────────
  addEvent: (message, type, agent) =>
    set(state => ({
      events: [
        { id: uid(), timestamp: new Date(), message, type, agent },
        ...state.events,
      ].slice(0, 100),
    })),

  // ── Auth ─────────────────────────────────────────────────────────────────
  setAuthStatus: (status) => set({ authStatus: status }),
}));

// ─── Derived: Trust Score ────────────────────────────────────────────────────

/**
 * Computes a 0–100 trust score from live state.
 * Used by ArmorIQ to display the Security Score.
 */
export const computeTrustScore = (state: PulseObserverState): { score: number; breakdown: string[] } => {
  const breakdown: string[] = [];
  let score = 100;

  // API availability (max -20)
  const apiStatuses = Object.values(state.apis);
  const offlineAPIs = apiStatuses.filter(a => a.status === 'offline').length;
  const retryingAPIs = apiStatuses.filter(a => a.status === 'retrying').length;
  if (offlineAPIs > 0) { score -= offlineAPIs * 10; breakdown.push(`${offlineAPIs} API(s) offline`); }
  if (retryingAPIs > 0) { score -= retryingAPIs * 5; breakdown.push(`${retryingAPIs} API(s) retrying`); }

  // Agent health (max -30)
  const agentStates = Object.values(state.agents);
  const failedAgents = agentStates.filter(a => a.status === 'failed').length;
  if (failedAgents > 0) { score -= failedAgents * 10; breakdown.push(`${failedAgents} agent(s) failed`); }

  // AI confidence (max -15)
  const conf = state.latestAudit?.confidenceScore;
  if (conf !== null && conf !== undefined) {
    if (conf < 70) { score -= 15; breakdown.push('Low AI confidence'); }
    else if (conf < 85) { score -= 5; breakdown.push('Moderate AI confidence'); }
  }

  // Schema / JSON validation (max -15)
  if (state.security.schemaValidation === 'failed') { score -= 10; breakdown.push('Schema validation failed'); }
  if (state.security.jsonParsed === 'failed') { score -= 5; breakdown.push('JSON parse failed'); }

  // Fallback activated (max -10)
  if (state.router.fallbackActivated) { score -= 10; breakdown.push('AI fallback activated'); }

  // Provider online (max -10)
  if (state.router.currentProvider === 'None') { score -= 10; breakdown.push('No AI provider active'); }

  return { score: Math.max(0, Math.min(100, score)), breakdown };
};
