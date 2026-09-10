import{assertRemoteIdentity}from'./environment-guard.mjs';
await assertRemoteIdentity(process.env,'hosted-test');
await import('../tests/hosted-cycle9.mjs');
