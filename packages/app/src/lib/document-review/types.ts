export type DocumentReviewChangeKind = 'add' | 'remove' | 'replace' | 'structural';

export interface DocumentReviewAuthorship {
  userLabel: string;
  userTime: string;
  agentLabel: string;
  agentTime: string;
  message?: string;
}

export interface DocumentReviewChange {
  id: string;
  time: string;
  section: string;
  summary: string;
  kind: DocumentReviewChangeKind;
  additions: number;
  deletions: number;
  authorship?: DocumentReviewAuthorship;
  structuralCaption?: string;
  anchorIndex: number;
}

export interface DocumentReviewTimelineSource {
  kind: 'timeline';
  docName: string;
  sha: string;
  parentSha: string | null;
  laterEdits: number;
  authorName: string;
  relativeTime: string;
  absoluteTime: string;
}

export interface DocumentReviewAgentSource {
  kind: 'agent';
  agentId: string;
  agentName: string;
  agentColor: string;
  agentIcon?: string;
  docName: string;
  keptCount: number;
  maxVersions: number;
}

export interface DocumentReviewDemoSource {
  kind: 'demo';
  docName: string;
}

export type DocumentReviewSource =
  | DocumentReviewTimelineSource
  | DocumentReviewAgentSource
  | DocumentReviewDemoSource;

export interface DocumentReviewView {
  source: DocumentReviewSource;
  agentDisplayName: string;
  agentColor: string;
  agentIcon?: string;
  timeRangeLabel: string;
  changes: readonly DocumentReviewChange[];
  selectedChangeId: string | null;
  renderMode: 'rendered' | 'source';
  marksHidden: boolean;
}
