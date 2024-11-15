// types.ts

// Assuming that Coin is a type defined elsewhere, we will use it here
export interface Coin<T> {
    amount: number;
    currency: T;
}

export interface ObjectData {
    objectId: string;
    version: string;
    digest: string;
    content: {
        dataType: string;
        type: string;
        hasPublicTransfer: boolean;
        fields: any;
    };
}

export interface SuibondPlatform {
    id: string;
    owner: string;
    foundation_ids: string[];
}

// Foundation data structure
export interface FoundationCap {
    id: string;
    owner: string;
    name: string;
    url: string;
    foundation_ids: string[];
}

export interface DeveloperCap {
    id: string;
    owner: string;
    name: string;
    url: string;
    unsubmitted_proposal: Proposal[];
    submitted_proposal: Proposal[];
    rejected_or_expired_proposal: Proposal[];
    completed_proposal: Proposal[];
}

export interface Foundation {
    id: string;
    owner: string;
    foundation_cap: string;
    name: string;
    url: string;
    bounties: Bounty[];
    // bounty_ids: string[];
}

export interface Bounty {
    id: string;
    foundation: string;
    name: string;
    bounty_type: number;
    risk_percent: number;
    min_amount: number;
    max_amount: number;
    unconfirmed_proposals: Proposal[];
    processing_proposals: Proposal[];
    completed_proposals: Proposal[];
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


export interface Project {
    id: string;
    proposal: string;
    title: string;
    description: string;
    duration_epochs: number;
    milestones: Milestone[];
    current_processing_milestone_number: number;
}

export interface Milestone {
    id: string;
    milestone_number: number,
    title: string,
    description: string,
    duration_epochs: number,
    submitted_epochs: number,
    deadline_epochs: number,
    milestone_submission: string,
    is_extended: boolean,
    state: number,
}