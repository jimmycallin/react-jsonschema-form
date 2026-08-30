import AjvDefault from 'ajv';
import addFormatsDefault from 'ajv-formats';
import type { FormatsPlugin } from 'ajv-formats';
import standaloneCodeDefault from 'ajv/dist/standalone/index.js';

/** `ajv`, `ajv-formats` and `ajv/dist/standalone` are CommonJS modules that assign the class or function
 * itself to `module.exports`, so Node hands exactly that value to a default import. Their declaration files
 * describe the default import as the module namespace instead, so the runtime shape is restated here rather
 * than by weakening strictness or adding `any` to the public API.
 */
export const Ajv = AjvDefault as unknown as typeof AjvDefault.default;
export type Ajv = InstanceType<typeof Ajv>;

export const addFormats = addFormatsDefault as unknown as FormatsPlugin;

export const standaloneCode = standaloneCodeDefault as unknown as typeof standaloneCodeDefault.default;
