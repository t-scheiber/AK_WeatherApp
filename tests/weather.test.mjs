import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../script.js',import.meta.url),'utf8');
function weather({configured=true,key="synthetic-fixture",geolocation,fail=false,forecast=[],currentOverride,forecastOverride}={}) {
 const texts=new Map(),requests=[],alerts=[],rendered=[];let ready,timer;
 const current=currentOverride??{dt:2000000000,main:{temp:21,feels_like:20,humidity:70},sys:{sunrise:1999990000,sunset:2000040000},weather:[{icon:'01d',description:'sunny'}]};
 const $=selector=>({text(value){if(value===undefined)return texts.get(selector)||'';texts.set(selector,value);return this;}});
 $.getJSON=(url,callback)=>{requests.push(url);if(callback)callback([{name:'Vienna',state:'Vienna',country:'AT'}]);return {fail(){return this;}};};
 $.when=()=>({done(callback){if(!fail)callback([current],[forecastOverride??{list:forecast}]);return this;},fail(callback){if(fail)callback({status:401,responseJSON:{message:'Invalid key'}},'error','');return this;}});
 const context=vm.createContext({document:{addEventListener(event,callback){assert.equal(event,'DOMContentLoaded');ready=callback;}},setTimeout:callback=>{timer=callback;return 1;},clearTimeout:()=>{},navigator:geolocation?{geolocation}:{},$,alert:value=>alerts.push(value),...(configured?{CONFIG:{OPENWEATHER_API_KEY:key}}:{})});
 vm.runInContext(source,context,{timeout:1000});context.callbackFuncWithData=data=>rendered.push(data);
 return {context,texts,requests,alerts,rendered,start:()=>ready(),timeout:()=>timer()};
}
test('missing configuration stops before any API request',()=>{
 const w=weather({configured:false});w.start();assert.equal(w.requests.length,0);assert.equal(w.alerts.length,1);assert.equal(w.texts.get('#locationText'),'Unbekannte Position');
});
test('unsupported geolocation falls back to Vienna and requests current, forecast and reverse-geocoding data',()=>{
 const w=weather();w.start();assert.equal(w.requests.length,3);
 for(const request of w.requests){const url=new URL(request);assert.equal(url.hostname,'api.openweathermap.org');assert.equal(url.searchParams.get('lat'),'48.208174');assert.equal(url.searchParams.get('lon'),'16.373819');}
 assert.equal(w.rendered.length,1);assert.equal(w.rendered[0].current.temp,21);assert.equal(w.texts.get('#locationText'),'Vienna, AT');
});
test('permission denial uses the same deterministic fallback location',()=>{
 const w=weather({geolocation:{getCurrentPosition(success,failure){failure({code:1});}}});w.start();assert.equal(new URL(w.requests[0]).searchParams.get('lat'),'48.208174');
});
test('granted geolocation is used for all weather requests',()=>{
 const w=weather({geolocation:{getCurrentPosition(success){success({coords:{latitude:47.2,longitude:11.4}});}}});w.start();
 for(const request of w.requests){const url=new URL(request);assert.equal(url.searchParams.get('lat'),'47.2');assert.equal(url.searchParams.get('lon'),'11.4');}
});
test('API authentication errors do not render stale data and produce an actionable explanation',()=>{
 const w=weather({fail:true});w.start();assert.equal(w.rendered.length,0);assert.equal(w.requests.length,2);assert.match(w.alerts[0],/invalid or inactive/);
});
test('forecast aggregation chooses daytime conditions and preserves daily minimum and maximum',()=>{
 const item=(hour,temp)=>({dt:Date.UTC(2030,0,2,hour)/1000,main:{temp,humidity:65},weather:[{icon:'02d',description:String(hour)}],wind:{speed:4,deg:90}});
 const w=weather({forecast:[item(0,3),item(12,18),item(18,9)]});w.start();const day=w.rendered[0].daily[1];
 assert.equal(day.temp.min,3);assert.equal(day.temp.max,18);assert.equal(day.weather[0].description,'12');assert.equal(w.rendered[0].daily.length,6);
});
test('empty forecast preserves the five-day renderer contract',()=>{
 const w=weather();w.start();assert.equal(w.rendered[0].daily.length,6);assert.ok(w.rendered[0].daily.every(value=>value===null));
});
test('location labels remain text and missing names use the fallback',()=>{
 const w=weather();w.context.geoLocCallbackFuncWithData([{name:'<img src=x onerror=alert(1)>',country:'AT'}]);assert.equal(w.texts.get('#locationText'),'<img src=x onerror=alert(1)>, AT');
 w.context.geoLocCallbackFuncWithData([]);assert.equal(w.texts.get('#locationText'),'Unbekannte Position');
});
test('malformed current response is reported without a rendering exception',()=>{
 const w=weather({currentOverride:{}});assert.doesNotThrow(()=>w.start());assert.equal(w.rendered.length,0);assert.match(w.alerts[0],/invalid weather response/);
});
test('malformed forecast container is reported without rendering',()=>{
 const w=weather({forecastOverride:{list:{}}});assert.doesNotThrow(()=>w.start());assert.equal(w.rendered.length,0);assert.match(w.alerts[0],/invalid weather response/);
});
test('malformed forecast entries cannot produce NaN or broken icon URLs',()=>{
 const w=weather({forecast:[{dt:NaN,main:{temp:2},weather:[]}]});assert.doesNotThrow(()=>w.start());assert.equal(w.rendered.length,0);assert.equal(w.alerts.length,1);
});
test('delayed geolocation waits before making weather requests',()=>{
 let success;const w=weather({geolocation:{getCurrentPosition(callback){success=callback;}}});w.start();assert.equal(w.requests.length,0);success({coords:{latitude:47.2,longitude:11.4}});assert.equal(w.requests.length,3);
});
test('nonresponsive geolocation falls back once and ignores a late grant',()=>{
 let success;const w=weather({geolocation:{getCurrentPosition(callback){success=callback;}}});w.start();w.timeout();success({coords:{latitude:47.2,longitude:11.4}});assert.equal(w.requests.length,3);assert.equal(new URL(w.requests[0]).searchParams.get('lat'),'48.208174');
});
test('invalid coordinates use the fixed fallback',()=>{
 const w=weather({geolocation:{getCurrentPosition(success){success({coords:{latitude:999,longitude:Infinity}});}}});w.start();assert.equal(new URL(w.requests[0]).searchParams.get('lat'),'48.208174');
});
test('browser geolocation exception uses the fixed fallback',()=>{
 const w=weather({geolocation:{getCurrentPosition(){throw Error('unavailable');}}});assert.doesNotThrow(()=>w.start());assert.equal(w.requests.length,3);
});
test('configuration characters remain a single API-key query value',()=>{
 const key='synthetic&units=imperial';const w=weather({key});w.start();
 for(const request of w.requests){const url=new URL(request);assert.equal(url.searchParams.get('appid'),key);if(url.pathname.includes('/data/'))assert.equal(url.searchParams.get('units'),'metric');}
});
