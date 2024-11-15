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

export const parseDeveloperCap = async (data: ObjectData): Promise<DeveloperCap> => {
    const unsubmitted_proposal = await getMultipleObjectsData(data.content.fields.unsubmitted_proposal)
        .then(data => data ? data.map(item => parseProposal(item)) : [])
    const submitted_proposal = await getMultipleObjectsData(data.content.fields.submitted_proposal)
        .then(data => data ? data.map(item => parseProposal(item)) : [])
    const rejected_or_expired_proposal = await getMultipleObjectsData(data.content.fields.rejected_or_expired_proposal)
        .then(data => data ? data.map(item => parseProposal(item)) : [])
    const completed_proposal = await getMultipleObjectsData(data.content.fields.completed_proposal)
        .then(data => data && data.length > 0 ? data.map(item => parseProposal(item)) : [])

    return {
        id: data.objectId,
        owner: data.content.fields.owner,
        name: data.content.fields.name,
        url: data.content.fields.url,
        unsubmitted_proposal: unsubmitted_proposal,
        submitted_proposal: submitted_proposal,
        rejected_or_expired_proposal: rejected_or_expired_proposal,
        completed_proposal: completed_proposal
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
        url: data.content.fields.url,
        bounties: bounties
    };
};

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


