// parse.ts

import { Foundation, Bounty, Proposal, Coin, Project } from './types'; // Adjust the import path to your types file

export const parseFoundationData = (data: any): Foundation => {
    const foundation = data.content?.fields;
    return {
        id: foundation?.id.id,
        owner: foundation?.owner,
        foundation_cap: foundation?.foundation_cap,
        name: foundation?.name,
        bounty_table: parseBountyTable(foundation?.bounty_table?.fields), // Parsing bounty table
        bounty_table_keys: foundation?.bounty_table_keys || [],
    };
};

// Helper function to parse the bounty table
const parseBountyTable = (bountyTable: any): Record<string, Bounty> => {
    const bountyRecords: Record<string, Bounty> = {};
    if (bountyTable) {
        // Assuming `bounty_table_keys` is already available
        bountyTable.bounty_table_keys?.forEach((key: string, index: number) => {
            bountyRecords[key] = {
                id: key,
                foundation: bountyTable.foundation,  // Assuming foundation ID is same as the one in bounty table
                name: bountyTable.bounty_table.fields[index]?.name,
                bounty_type: bountyTable.bounty_table.fields[index]?.bounty_type,
                risk_percent: bountyTable.bounty_table.fields[index]?.risk_percent,
                min_amount: bountyTable.bounty_table.fields[index]?.min_amount,
                max_amount: bountyTable.bounty_table.fields[index]?.max_amount,
                proposals: parseProposals(bountyTable.bounty_table.fields[index]?.proposals),
            };
        });
    }
    return bountyRecords;
};

// Helper function to parse proposals of a bounty
const parseProposals = (proposals: any): Proposal[] => {
    return proposals?.map((proposal: any) => ({
        id: proposal.id,
        proposer: proposal.proposer,
        developer_cap: proposal.developer_cap,
        foundation: proposal.foundation,
        bounty: proposal.bounty,

        title: proposal.title,
        project: parseProject(proposal.project),

        state: proposal.state,
        submitted_epochs: proposal.submitted_epochs,
        confirmed_epochs: proposal.confirmed_epochs,
        completed_epochs: proposal.completed_epochs,
        current_deadline_epochs: proposal.current_deadline_epochs,

        grant_size: proposal.grant_size,
        stake: parseCoin(proposal.stake),
    })) || [];
};

// Helper function to parse project data in a proposal
const parseProject = (project: any): Project => {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        // Add other fields if necessary
    };
};

// Helper function to parse coin data
const parseCoin = (coin: any): Coin<'SUI'> => {
    return {
        amount: coin?.amount,
        currency: 'SUI', // Assuming 'SUI' is the only supported currency
    };
};
