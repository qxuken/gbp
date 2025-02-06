import PocketBase from 'pocketbase';

let pb = new PocketBase('http://127.0.0.1:8090');

async function seed() {
    let userId = 'ttttttttttttttt';

    await pb.collection('_superusers').authWithPassword('test@example.com', 'testtesttest');
    try {
        await pb.collection('users').create({id: userId, email: 'test@example.com', passwordConfirm: 'testtesttest', password: 'testtesttest', verified: true})
    } catch {
        await pb.collection('users').delete(userId)
        await pb.collection('users').create({id: userId, email: 'test@example.com', passwordConfirm: 'testtesttest', password: 'testtesttest', verified: true})
    }
    let impersonateClient = await pb.collection('users').impersonate(userId, 3600)
    console.log('authorized');

    let contest = await impersonateClient.collection('contests').create({
        title: 'Contest Title',
        author: userId,
        state: 'active',
        access_token: '',
    });
    console.log('created contest');

    let questions = await seedQuestions(impersonateClient, userId);
    let files = await seedFiles(impersonateClient, userId);

    await seedVersion(impersonateClient, contest.id, 'Test Contest Version #1', 'ready', questions, files);
    await seedVersion(impersonateClient, contest.id, 'Test Contest Version #1', 'ready', questions, files);
    let active_version = await seedVersion(impersonateClient, contest.id, 'Test Contest Version #2', 'ready', questions, files);
    await seedVersion(impersonateClient, contest.id, 'Test Contest Version #3', 'ready', questions, files);
    await seedVersion(impersonateClient, contest.id, 'Test Contest Version #4', 'draft', questions, files);

    await impersonateClient.collection('contests').update(contest.id, {
        active_version,
    });

    console.log(contest.id);
}

/**
  * @param {import('pocketbase').default} pb
  * @param {string | undefined} userId
  * @returns {Promise<string[]>}
  */
async function seedQuestions(pb, userId) {
    let questions = [
        { text: 'Pick best simplier to understand', type: 'pick-version' },
        { text: 'Pick best option, NOW', type: 'options', values: 'option 1,option 2,option 3' },
        { text: 'Do you like to split files?', type: 'bool' },
        { text: 'Any additional comments?', descriptiob: '<p>I mean, <b>any?</b><p>', type: 'text' }
    ];
    let ret = [];
    for (let {text, type, description, values} of questions) {
        let rec = await pb.collection('contest_questions').create({
            author: userId,
            text,
            type,
            values,
            description,
        });
        ret.push(rec.id);
    }
    return ret;
}

/**
  * @param {import('pocketbase').default} pb
  * @param {string | undefined} userId
  * @returns {Promise<{ a: string[], b: string[] }>}
  */
async function seedFiles(pb, userId) {
    /** @type {{ a: string[], b: string[] }} */
    let ret = { a: [], b: []};

    /** @type {Map<string, string>} */
    let filesA = new Map();
    filesA.set('filesArr.ts', `
export let files = ['fileA', 'fileB'];
`)
    filesA.set('logFile.ts', `
export function logFile(file: string) {
  console.log('file', file);
}
`);
    filesA.set('test.ts', `
import { files } from 'a/filesArr'
import { logFile } from 'a/logFile'

files.forEach(logFile);

for (let file of files) {
  logFile(file);
}
`);

    for (let [path, f] of filesA.entries()) {
        let rec = await pb.collection('contest_files').create({
            author: userId,
            path,
            content: f.trim(),
            language: 'ts',
        });
        ret.a.push(rec.id);
    }

    let fileB = await pb.collection('contest_files').create({
        author: userId,
        path: 'test.ts',
        content: `
let t: TestTypeA = { name: 1 };

function l (t: TestTypeA) {
  console.log(t.name);
}

l(t);
`.trim(),
        language: 'ts',
    });
    let fileBTypes = await pb.collection('contest_files').create({
        author: userId,
        path: 'types.d.ts',
        content: 'declare type TestTypeA = { name: 1 }',
        language: 'ts',
        hidden: true,
    });

    ret.b.push(fileB.id);
    ret.b.push(fileBTypes.id);
    return ret;
}
/**
  * @param {import('pocketbase').default} pb
  * @param {string} contest
  * @param {string} title
  * @param {string} state
  * @param {string[]} questions
  * @param {{ a: string[], b: string[] }} files
  * @returns {Promise<string>}
  */
async function seedVersion(pb, contest, title, state, questions, files) {
    let cv = await pb.collection('contest_versions').create({
        contest,
        title,
        state,
        description: 'test',
        questions,
        files_a: files.a,
        files_b: files.b,
    });
    return cv.id;
}

seed();
