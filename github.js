const { readFileSync } = require("node:fs");
const { execSync } = require("child_process");

// https://docs.github.com/en/actions/learn-github-actions/environment-variables#default-environment-variables

function parseBranch(branch) {
  return branch
    ? /^(?:refs\/heads\/)?(?<branch>.+)$/i.exec(branch)?.[1]
    : undefined;
}

const getPrEvent = () => {
  try {
    const event = process.env.GITHUB_EVENT_PATH
      ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"))
      : undefined;

    if (event && event.pull_request) {
      return {
        branch: event.pull_request.base
          ? parseBranch(event.pull_request.base.ref)
          : undefined,
        pr: event.pull_request.number,
      };
    }
  } catch {
    // Noop
  }

  return { pr: undefined, branch: undefined };
};

const getPrNumber = () => {
  const event = process.env.GITHUB_EVENT_PATH
    ? JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"))
    : undefined;

  return event && event.pull_request ? event.pull_request.number : undefined;
};

const splitBy = "<##>";
const gitLogFormat = [
  /* full hash */ "%H",
  /* Author's name */ "%an",
  /* Author's email */ "%ae",
].join(splitBy);
const latestCommitCommand = `git log -1 --pretty=format:"${gitLogFormat}"`;

function getLatestCommitFromGit() {
  execSync(latestCommitCommand, { cwd: process.cwd() }, (_, stdout) => {
    if (stdout.includes(splitBy)) {
      const [hash, authorName, authorEmail] = stdout.split(splitBy);
      if (hash && authorName) {
        let author = authorName;

        if (authorEmail) {
          author += ` <${authorEmail}>`;
        }

        resolve({
          hash,
          author,
        });
        return;
      }
    }

    resolve(null);
  });
}

function useGitHub() {
  const isPr =
    process.env.GITHUB_EVENT_NAME === "pull_request" ||
    process.env.GITHUB_EVENT_NAME === "pull_request_target";
  const branch = parseBranch(
    process.env.GITHUB_EVENT_NAME === "pull_request_target"
      ? `refs/pull/${getPrNumber()}/merge`
      : process.env.GITHUB_REF
  );

  return {
    commit: getLatestCommitFromGit(),
    build: process.env.GITHUB_RUN_ID,
    isPr,
    branch,
    prBranch: isPr ? branch : undefined,
    repository: process.env.GITHUB_REPOSITORY,
    accountId: process.env.GITHUB_REPOSITORY_OWNER_ID,
    repositoryId: process.env.GITHUB_REPOSITORY_ID,
    root: process.env.GITHUB_WORKSPACE,
    ...(isPr ? getPrEvent() : undefined),
  };
}

const stuff = useGitHub();

console.log(stuff);
