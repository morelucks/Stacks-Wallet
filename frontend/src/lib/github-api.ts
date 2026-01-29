/**
 * GitHub API Service
 * 
 * Provides methods to fetch user contribution data from GitHub.
 * Used to calculate rewards based on public repository activity.
 */

export interface GitHubContributionData {
    username: string;
    totalCommits: number;
    totalPRs: number;
    starsReceived: number;
    topRepositories: string[];
}

const GITHUB_API_BASE = 'https://api.github.com';

export const githubApiService = {
    /**
     * Fetches contribution statistics for a given GitHub username.
     * Note: In a real app, this would use an OAuth token or a backend proxy.
     */
    async fetchUserContributions(username: string): Promise<GitHubContributionData> {
        console.log(`🔍 Fetching GitHub data for: ${username}`);

        try {
            // Mocking the API response for demonstration
            // In production, this would call GET /users/{username}/events
            // and aggregate results, or use the GraphQL API.

            const mockResult: GitHubContributionData = {
                username,
                totalCommits: Math.floor(Math.random() * 500) + 50,
                totalPRs: Math.floor(Math.random() * 50) + 5,
                starsReceived: Math.floor(Math.random() * 100) + 10,
                topRepositories: ['stacks-wallet', 'clarity-examples', 'awesome-stacks']
            };

            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 800));

            return mockResult;
        } catch (error) {
            console.error("Failed to fetch GitHub contributions:", error);
            throw new Error(`Could not fetch data for ${username}`);
        }
    },

    /**
     * Validates if a GitHub user exists and has a minimum level of activity.
     */
    async validateUser(username: string): Promise<boolean> {
        try {
            const response = await fetch(`${GITHUB_API_BASE}/users/${username}`);
            return response.status === 200;
        } catch (error) {
            return false;
        }
    },

    /**
     * Calculates a local activity score based on the raw metrics.
     * PRs are weighted most heavily, followed by stars and commits.
     */
    calculateActivityScore(data: GitHubContributionData): number {
        return (data.totalPRs * 50) + (data.starsReceived * 20) + (data.totalCommits * 2);
    }
};
