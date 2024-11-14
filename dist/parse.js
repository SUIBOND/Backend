"use strict";
// parse.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFoundationData = void 0;
const parseFoundationData = (data) => {
    var _a;
    const foundation = (_a = data.content) === null || _a === void 0 ? void 0 : _a.fields;
    return {
        id: foundation === null || foundation === void 0 ? void 0 : foundation.id.id,
        owner: foundation === null || foundation === void 0 ? void 0 : foundation.owner,
        foundation_cap: foundation === null || foundation === void 0 ? void 0 : foundation.foundation_cap,
        name: foundation === null || foundation === void 0 ? void 0 : foundation.name,
        bounty_table_keys: (foundation === null || foundation === void 0 ? void 0 : foundation.bounty_table_keys) || [],
    };
};
exports.parseFoundationData = parseFoundationData;
// Helper function to parse the bounty table
const parseBountyTable = (bountyTable) => {
    var _a;
    const bountyRecords = {};
    if (bountyTable) {
        // Assuming `bounty_table_keys` is already available
        (_a = bountyTable.bounty_table_keys) === null || _a === void 0 ? void 0 : _a.forEach((key, index) => {
            var _a, _b, _c, _d, _e, _f;
            bountyRecords[key] = {
                id: key,
                foundation: bountyTable.foundation, // Assuming foundation ID is same as the one in bounty table
                name: (_a = bountyTable.bounty_table.fields[index]) === null || _a === void 0 ? void 0 : _a.name,
                bounty_type: (_b = bountyTable.bounty_table.fields[index]) === null || _b === void 0 ? void 0 : _b.bounty_type,
                risk_percent: (_c = bountyTable.bounty_table.fields[index]) === null || _c === void 0 ? void 0 : _c.risk_percent,
                min_amount: (_d = bountyTable.bounty_table.fields[index]) === null || _d === void 0 ? void 0 : _d.min_amount,
                max_amount: (_e = bountyTable.bounty_table.fields[index]) === null || _e === void 0 ? void 0 : _e.max_amount,
                proposals: parseProposals((_f = bountyTable.bounty_table.fields[index]) === null || _f === void 0 ? void 0 : _f.proposals),
            };
        });
    }
    return bountyRecords;
};
// Helper function to parse proposals of a bounty
const parseProposals = (proposals) => {
    return (proposals === null || proposals === void 0 ? void 0 : proposals.map((proposal) => ({
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
    }))) || [];
};
// Helper function to parse project data in a proposal
const parseProject = (project) => {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        // Add other fields if necessary
    };
};
// Helper function to parse coin data
const parseCoin = (coin) => {
    return {
        amount: coin === null || coin === void 0 ? void 0 : coin.amount,
        currency: 'SUI', // Assuming 'SUI' is the only supported currency
    };
};
