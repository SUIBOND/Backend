// Foundation data structure
interface Foundation {
    id: string;
    owner: string;
    foundation_cap: string;
    name: string;
    bounty_array: Bounty[];
}

// Bounty data structure
interface Bounty {
    id: string;
    foundation: string;
    name: string;
    bounty_type: number;
    risk_percent: number;
    min_amount: number;
    max_amount: number;
    // fund: Coin<'SUI'>;
    proposals: ProposalsOfBounty;
}

// ProposalsOfBounty structure
interface ProposalsOfBounty {
    unconfirmed_proposals: Proposal[];
    processing_proposals: Proposal[];
    completed_proposals: Proposal[];
}

interface Proposal {
    id: string;

}

interface Coin {

}