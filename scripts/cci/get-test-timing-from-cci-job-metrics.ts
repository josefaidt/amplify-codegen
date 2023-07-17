import { join } from 'path';
import { REPO_ROOT, getCCIClient, getTestFiles, getTestNameFromPath, getTimingsFromJobsData, saveJobMetrics, saveTestTimings } from './utils';

async function main(): Promise<void> {
  const client = getCCIClient();
  console.log('Fetching job metrics...');
  const data = await client.getAllJobMetrics();
  saveJobMetrics(data);

  const testSuites = getTestFiles(join(REPO_ROOT, 'packages', 'amplify-codegen-e2e-tests'));

  const jobTimings = getTimingsFromJobsData();
  const testRuntimes = testSuites.map(t => {
    const oldName = getTestNameFromPath(t);
    if (jobTimings.has(oldName)) {
      return {
        test: t,
        medianRuntime: jobTimings.get(oldName) as number,
      };
    } else {
      console.log('Could not find timing for:', t);
      return {
        test: t,
        medianRuntime: 10, // default for unknown
      };
    }
  });
  testRuntimes.sort((a, b) => {
    return a.medianRuntime - b.medianRuntime;
  });
  saveTestTimings({
    lastUpdated: new Date().toISOString(),
    totalTestFiles: testRuntimes.length,
    timingData: testRuntimes,
  });
}
main();