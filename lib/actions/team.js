'use server';

import * as service from './services/team.service';

export const getTeams = service.getTeams;
export const getTeamWithMembers = service.getTeamWithMembers;
export const createTeam = service.createTeam;
export const updateTeam = service.updateTeam;
export const deleteTeam = service.deleteTeam;
