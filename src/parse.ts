// parse.ts

import { getMultipleObjectsData } from './object';
import {ObjectData, Foundation, Bounty, Proposal, Coin, Project, Milestone, DeveloperCap, FoundationCap, SuibondPlatform } from './types';

export const parseObjectData = (data: any): ObjectData => {
    const objectData: ObjectData = {
        objectId: data.objectId || '',
        version: data.version || '',
        digest: data.digest || '',
        content: {
            dataType: data.content.dataType || '',
            type: data.content.type || '',
            hasPublicTransfer: data.content.hasPublicTransfer || false,
            fields: data.content.fields || {},
        },
      };
    return objectData
};

// FoundationCap 데이터를 파싱하는 함수
export const parseFoundationCap = (data: ObjectData): FoundationCap => {
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
export const parseDeveloperCap = (data: ObjectData): DeveloperCap => {
    const fields = data.content?.fields;
    return {
        id: fields.id.id,
        owner: fields.owner,
        name: fields.name,
        url: fields.url,
        // unsubmitted_proposal: fields.unsubmitted_proposal.map((proposalId: string) => parseProposal(proposalId)),
        unsubmitted_proposal: fields.unsubmitted_proposal,
        submitted_proposal: fields.submitted_proposal,
        rejected_or_expired_proposal: fields.rejected_or_expired_proposal,
        completed_proposal: fields.completed_proposal,
    };
};


export const parseSuibondPlatfom = (data: ObjectData): SuibondPlatform => {
    return {
        id: data.objectId,
        owner: data.content.fields.owner,
        foundation_ids: data.content.fields.foundation_ids,
    };
};
export const parseFoundation = async (data: ObjectData): Promise<Foundation> => {
    const pBounties = await getMultipleObjectsData(data.content.fields.bounty_table_keys)
        .then(data => data ? data.map(async item => await parseBounty(item)) : [])
    const bounties = await Promise.all(pBounties.map(async (item) => await item));
    return {
        id: data.objectId,
        owner: data.content.fields.owner,
        foundation_cap: data.content.fields.foundation_cap,
        name: data.content.fields.name,
        bounties: bounties
    };
};

// parseBounty 함수 추가:
export const parseBounty = async (data: ObjectData): Promise<Bounty> => {
    const unconfirmed_proposals = await getMultipleObjectsData(data.content.fields.proposals.fields.unconfirmed_proposal_ids)
        .then(data => data ? data.map(item => parseProposal(item)) : []);
    const processing_proposals = await getMultipleObjectsData(data.content.fields.proposals.fields.unconfirmed_proposal_ids)
        .then(data => data ? data.map(item => parseProposal(item)) : []);
    const completed_proposals = await getMultipleObjectsData(data.content.fields.proposals.fields.unconfirmed_proposal_ids)
        .then(data => data ? data.map(item => parseProposal(item)) : []);
    return {
        id: data.objectId,
        foundation: data.content.fields.foundation,
        name: data.content.fields.name,
        bounty_type: data.content.fields.bounty_type,
        risk_percent: data.content.fields.risk_percent,
        min_amount: data.content.fields.min_amount,
        max_amount: data.content.fields.max_amount,
        unconfirmed_proposals: unconfirmed_proposals,
        processing_proposals: processing_proposals,
        completed_proposals: completed_proposals,
    }
};

const parseProposal = (data: ObjectData): Proposal => {
    return {
        id: data.objectId,
        proposer: data.content.fields.proposer,
        developer_cap: data.content.fields.developer_cap,
        foundation: data.content.fields.foundation,
        bounty: data.content.fields.bounty,
        title: data.content.fields.title,
        project: parseProject(data.content.fields.project),
        state: data.content.fields.state,
        submitted_epochs: data.content.fields.submitted_epochs,
        confirmed_epochs: data.content.fields.confirmed_epochs,
        completed_epochs: data.content.fields.completed_epochs,
        current_deadline_epochs: data.content.fields.current_deadline_epochs,
        grant_size: data.content.fields.grant_size,
        stake: data.content.fields.stake,
    };
};

const parseProject = (projectData: any): Project => {
    return { 
        id: projectData.fields.id.id,
        title: projectData.fields.title,
        proposal: projectData.fields.proposal,
        description: projectData.fields.description,
        duration_epochs: projectData.fields.duration_epochs,
        milestones: (projectData.fields.milestones as any[]).map(item => parseMilestone(item)),
        current_processing_milestone_number: projectData.fields.current_processing_milestone_number
    }
};

const parseMilestone = (milestoneData: any): Milestone => {
    return {
        id: milestoneData.fields.id.id,
        milestone_number: milestoneData.fields.milestone_number,
        title: milestoneData.fields.title,
        description: milestoneData.fields.description,
        duration_epochs: milestoneData.fields.duration_epochs,
        submitted_epochs: milestoneData.fields.submitted_epochs,
        deadline_epochs: milestoneData.fields.deadline_epochs,
        milestone_submission: milestoneData.fields.milestone_submission,
        is_extended: milestoneData.fields.is_extended,
        state: milestoneData.fields.state
    };
};

// 필요 없으면 제거 예정 ------------------------------------------
// parseBountyForEndpoint 함수 추가
// export const parseBountyForEndpoint = (bountyData: any): Bounty => {
//     return {
//         id: bountyData.id,
//         foundation: bountyData.foundation,
//         name: bountyData.name,
//         bounty_type: bountyData.bounty_type,
//         risk_percent: bountyData.risk_percent,
//         min_amount: bountyData.min_amount,
//         max_amount: bountyData.max_amount,
//         // unconfirmed_proposals: parseProposalsForEndpoint(bountyData.unconfiremd_proposals),
//         // processing_proposals: parseProposalsForEndpoint(bountyData.processing_proposals),
//         // completed_proposals: parseProposalsForEndpoint(bountyData.completed_proposals),
//     };
// };

// parseProposalsForEndpoint 함수 추가
// const parseProposalsForEndpoint = (proposals: any[]): Proposal[] => {
//     return proposals?.map((proposal: any) => ({
//         id: proposal.id,
//         proposer: proposal.proposer,
//         developer_cap: proposal.developer_cap,
//         foundation: proposal.foundation,
//         bounty: proposal.bounty,
//         title: proposal.title,
//         project: parseProjectForEndpoint(proposal.project),
//         state: proposal.state,
//         submitted_epochs: proposal.submitted_epochs,
//         confirmed_epochs: proposal.confirmed_epochs,
//         completed_epochs: proposal.completed_epochs,
//         current_deadline_epochs: proposal.current_deadline_epochs,
//         grant_size: proposal.grant_size,
//         stake: parseCoinForEndpoint(proposal.stake),
//     })) || [];
// };

// parseProjectForEndpoint 함수 추가
// const parseProjectForEndpoint = (project: any): Project => {
//     return {
//         id: project.id,
//         title: project.name,
//         // description: project.description,
//         // milestondes: project.milestondes.map((milestone: any) => parseMilestoneForEndpoint(milestone)),
//         // id: string;
//         proposal: project,
//         // title: project,
//         description: project,
//         duration_epochs: project,
//         milestondes: project,
//         current_processing_milestone_number: project,
//     };
// };

// parseMilestoneForEndpoint 함수 추가
// const parseMilestoneForEndpoint = (milestone: any): Milestone => {
//     return {
//         id: milestone.id,
//     };
// };

// parseCoinForEndpoint 함수 추가
const parseCoinForEndpoint = (coin: any): Coin<'SUI'> => {
    return {
        amount: coin?.amount,
        currency: 'SUI',
    };
};
// 필요 없으면 제거 예정 ------------------------------------------



// // parseBountyTable 함수 수정:
// const parseBountyTable = (bountyTable: any): Record<string, Bounty> => {
//     const bountyRecords: Record<string, Bounty> = {};
//     if (bountyTable) {
//         bountyTable.bounty_table_keys?.forEach((key: string, index: number) => {
//             bountyRecords[key] = parseBounty(bountyTable.bounty_table.fields[index], key);
//         });
//     }
//     return bountyRecords;
// };



// // parseBounties 함수 수정:
// const parseBounties = (bountyTable: any): Bounty[] => {
//     return bountyTable.bounty_table_keys?.map((key: string, index: number) =>
//         parseBounty(bountyTable.bounty_table.fields[index], key)
//     ) || [];
// };




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



// Coin 데이터를 파싱하는 함수
const parseCoin = (coin: any): Coin<'SUI'> => {
    return {
        amount: coin?.amount,
        currency: 'SUI',
    };
};
