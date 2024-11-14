// parse.ts

import { Foundation, Bounty, Proposal, Coin, Project, Milestone, DeveloperCap, FoundationCap } from './types';

// 기존 parseFoundationData 함수에서 bounty_table, bounty_table_keys 부분을 수정:
export const parseFoundationData = (data: any): Foundation => {
    const foundation = data.content?.fields;
    return {
        id: foundation?.id.id,
        owner: foundation?.owner,
        foundation_cap: foundation?.foundation_cap,
        name: foundation?.name,
        bounty_table: parseBountyTable(foundation?.bounty_table?.fields), // 수정
        bounty_table_keys: foundation?.bounty_table_keys || [],            // 수정
        bounties: parseBounties(foundation?.bounty_table?.fields)          // 수정
    };
};


// FoundationCap 데이터를 파싱하는 함수
export const parseFoundationCap = (data: any): FoundationCap => {
    const fields = data.content?.fields;
    return {
        id: fields.id.id,
        owner: fields.owner,
        name: fields.name,
        url: fields.url,
        foundation_ids: fields.foundation_ids || []
    };
};

// DeveloperCap 데이터를 파싱하는 함수
export const parseDeveloperCap = (data: any): DeveloperCap => {
    const fields = data.content?.fields;
    return {
        id: fields.id.id,
        owner: fields.owner,
        name: fields.name,
        url: fields.url,
        unsubmitted_proposal: fields.unsubmitted_proposal.map((proposalId: string) => parseProposal(proposalId)),
        submitted_proposal: fields.submitted_proposal,
        rejected_or_expired_proposal: fields.rejected_or_expired_proposal,
        completed_proposal: fields.completed_proposal,
    };
};


// 개별 Proposal ID 데이터를 파싱하는 헬퍼 함수
const parseProposal = (proposalId: string): Proposal => {
    return {
        id: proposalId,
        proposer: "",
        developer_cap: "",
        foundation: "",
        bounty: "",
        title: "",
        project: { id: "", name: "", description: "", milestondes: [] },
        state: 0,
        submitted_epochs: 0,
        confirmed_epochs: 0,
        completed_epochs: 0,
        current_deadline_epochs: 0,
        grant_size: 0,
        stake: { amount: 0, currency: "SUI" },
    };
};

// parseBountyTable 함수 수정:
const parseBountyTable = (bountyTable: any): Record<string, Bounty> => {
    const bountyRecords: Record<string, Bounty> = {};
    if (bountyTable) {
        bountyTable.bounty_table_keys?.forEach((key: string, index: number) => {
            bountyRecords[key] = parseBounty(bountyTable.bounty_table.fields[index], key);
        });
    }
    return bountyRecords;
};


// parseBounties 함수 수정:
const parseBounties = (bountyTable: any): Bounty[] => {
    return bountyTable.bounty_table_keys?.map((key: string, index: number) =>
        parseBounty(bountyTable.bounty_table.fields[index], key)
    ) || [];
};


// parseBounty 함수 추가:
export const parseBounty = (bountyData: any, id: string): Bounty => {
    return {
        id,
        foundation: bountyData.foundation,
        name: bountyData.name,
        bounty_type: bountyData.bounty_type,
        risk_percent: bountyData.risk_percent,
        min_amount: bountyData.min_amount,
        max_amount: bountyData.max_amount,
        unconfiremd_proposals: parseProposals(bountyData.unconfiremd_proposals),
        processing_proposals: parseProposals(bountyData.processing_proposals),
        completed_proposals: parseProposals(bountyData.completed_proposals),
    };
};


// Proposal 데이터를 파싱하는 함수
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

// Project 데이터를 파싱하는 함수
const parseProject = (project: any): Project => {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        milestondes: project.milestondes.map((milestone: any) => parseMilestone(milestone)),
    };
};

// Milestone 데이터를 파싱하는 함수
const parseMilestone = (milestone: any): Milestone => {
    return {
        id: milestone.id
    };
};

// Coin 데이터를 파싱하는 함수
const parseCoin = (coin: any): Coin<'SUI'> => {
    return {
        amount: coin?.amount,
        currency: 'SUI',
    };
};
