
// types.ts

// Assuming that Coin is a type defined elsewhere, we will use it here
export interface Coin<T> {
    amount: number;
    currency: T;
}

// Foundation data structure
export interface FoundationCap {
    id: string;
    owner: string;
    name: string;
    // url: string;
    foundation_ids: string[];
}

export interface DeveloperCap {
    id: string;
    owner: string;
    name: string;
    url: string;
    unsubmitted_proposal: string[];
    submitted_proposal: string[];
    rejected_or_expired_proposal: string[];
    completed_proposal: string[];
}

export interface Project {
    id: string;
    name: string;
    description: string;
    // Add more fields as necessary
}

export interface Proposal {
    id: string;
    proposer: string;
    developer_cap: string;
    foundation: string;
    bounty: string;

    title: string;
    project: Project;

    state: number;
    submitted_epochs: number;
    confirmed_epochs: number;
    completed_epochs: number;
    current_deadline_epochs: number;

    grant_size: number;
    stake: Coin<'SUI'>;
}

export interface Bounty {
    id: string;
    foundation: string;
    name: string;
    bounty_type: number;
    risk_percent: number;
    min_amount: number;
    max_amount: number;
    proposals: Proposal[];
}

export interface Foundation {
    id: string;
    owner: string;
    foundation_cap: string;
    name: string;
    bounty_table: Record<string, Bounty>;
    bounty_table_keys: string[];
}
