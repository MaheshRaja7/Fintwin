const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "An unexpected error occurred.");
  }

  return data;
}

export const api = {
  auth: {
    signup: (body: any) => request<any>("/auth/signup", { method: "POST", body: JSON.stringify(body) }),
    login: (body: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request<any>("/auth/logout", { method: "POST" }),
    demoLogin: () => request<any>("/auth/demo-login", { method: "POST" }),
    getMe: () => request<any>("/auth/me"),
    updateOnboarding: (body: any) => request<any>("/auth/onboarding", { method: "POST", body: JSON.stringify(body) }),
  },

  dashboard: {
    getDashboard: () => request<any>("/dashboard"),
  },

  transactions: {
    get: (params: Record<string, any> = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") q.append(k, String(v));
      });
      return request<any>(`/transactions?${q.toString()}`);
    },
    create: (body: any) => request<any>("/transactions", { method: "POST", body: JSON.stringify(body) }),
    parseNaturalLanguage: (text: string, autoSave: boolean = false) =>
      request<any>("/transactions/parse", { method: "POST", body: JSON.stringify({ text, autoSave }) }),
    update: (id: string, body: any) => request<any>(`/transactions/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/transactions/${id}`, { method: "DELETE" }),
  },

  budgets: {
    get: () => request<any>("/budgets"),
    set: (body: any) => request<any>("/budgets", { method: "POST", body: JSON.stringify(body) }),
    delete: (id: string) => request<any>(`/budgets/${id}`, { method: "DELETE" }),
  },

  goals: {
    get: () => request<any>("/goals"),
    create: (body: any) => request<any>("/goals", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: any) => request<any>(`/goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    contribute: (id: string, amount: number) =>
      request<any>(`/goals/${id}/contribute`, { method: "POST", body: JSON.stringify({ amount }) }),
    delete: (id: string) => request<any>(`/goals/${id}`, { method: "DELETE" }),
  },

  subscriptions: {
    get: () => request<any>("/subscriptions"),
    create: (body: any) => request<any>("/subscriptions", { method: "POST", body: JSON.stringify(body) }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/subscriptions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    scan: () => request<any>("/subscriptions/scan", { method: "POST" }),
  },

  predictions: {
    getForecast: (horizon: number = 30) => request<any>(`/predictions/forecast?horizon=${horizon}`),
    getOverspendingRisk: () => request<any>("/predictions/overspending"),
    getAnomalies: () => request<any>("/predictions/anomalies"),
    getFinancialHealth: () => request<any>("/predictions/financial-health"),
  },

  recommendations: {
    get: () => request<any>("/recommendations"),
    refresh: () => request<any>("/recommendations/refresh", { method: "POST" }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/recommendations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  },

  reports: {
    get: (period: string = "monthly") => request<any>(`/reports?period=${period}`),
  },

  ai: {
    chat: (message: string, conversationId?: string) =>
      request<any>("/ai/chat", { method: "POST", body: JSON.stringify({ message, conversationId }) }),
    getConversations: () => request<any>("/ai/conversations"),
    getConversation: (id: string) => request<any>(`/ai/conversations/${id}`),
    clearConversation: (id: string) => request<any>(`/ai/conversations/${id}`, { method: "DELETE" }),
    simulate: (params: any) => request<any>("/ai/simulation", { method: "POST", body: JSON.stringify(params) }),
    parseExpense: (text: string) => request<any>("/ai/expense-parser", { method: "POST", body: JSON.stringify({ text }) }),
  },
};
