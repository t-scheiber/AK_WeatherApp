import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../generate-config.js',import.meta.url),'utf8');
function generate(value,envFile) {
 let output;
 const context={__dirname:'/fixture',process:{env:{...(value===undefined?{}:{OPENWEATHER_API_KEY:value})}},require(name){
  if(name==='path')return path;
  assert.equal(name,'fs');return {existsSync:()=>envFile!==undefined,readFileSync:()=>envFile,writeFileSync(file,content){assert.equal(file,'/fixture/config.js');output=content;}};
 }};
 vm.runInNewContext(source,context,{timeout:1000});return vm.runInNewContext(output+'\nCONFIG.OPENWEATHER_API_KEY',{}, {timeout:1000});
}
test('deployment build uses a provided synthetic key',()=>assert.equal(generate('synthetic-fixture'),'synthetic-fixture'));
test('local env-file values remain supported',()=>assert.equal(generate(undefined,'# local example\nOPENWEATHER_API_KEY="synthetic-local"\n'),'synthetic-local'));
test('missing key produces a valid empty configuration for the UI warning',()=>assert.equal(generate(undefined),''));
test('configuration values are serialized as data even when they contain quotes, newlines and backslashes',()=>{
 const value="quote'\n\\ synthetic";assert.equal(generate(value),value);
});
