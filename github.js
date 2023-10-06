const { execSync } = require("child_process");

// https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables

function getLatestPRCommit() {
  try {
    return execSync(
      `git log ${process.env.GITHUB_HEAD_REF} -1 --pretty=format:"%H"`
    ).toString();
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

function useGitHub() {
  const isPr =
    process.env.GITHUB_EVENT_NAME === "pull_request" ||
    process.env.GITHUB_EVENT_NAME === "pull_request_target";

  const commit = getLatestPRCommit();

  return {
    isPr,
    commit,
    build: process.env.GITHUB_RUN_ID,
    prBranch: process.env.GITHUB_HEAD_REF,
    repository: process.env.GITHUB_REPOSITORY,
    accountId: process.env.GITHUB_REPOSITORY_OWNER_ID,
    repositoryId: process.env.GITHUB_REPOSITORY_ID,
    root: process.env.GITHUB_WORKSPACE,
  };
}

const stuff = useGitHub();

console.log(stuff);
