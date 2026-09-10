export const environments: Record<string,{projectRef:string|null;url:string|null;appOrigins:string[];provisioned:boolean;deployment?:{projectId:string;projectName:string;branch:string;target:string}}>;
export function assertEnvironment(env?: NodeJS.ProcessEnv,action?:string): {purpose:string;projectRef?:string;url?:string};
export function assertRemoteIdentity(env?:NodeJS.ProcessEnv,action?:string):Promise<{purpose:string;projectRef?:string;url?:string}>;
