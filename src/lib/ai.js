const config=require("../config");
let provider=null;
function setProvider(fn){provider=typeof fn==="function"?fn:null;}
async function answer(prompt, context={}){
  if(provider)return provider(prompt,context);
  if(!config.smartBot.ai.enabled)throw new Error("AI mode is enabled but no AI provider is configured.");
  throw new Error("No AI provider is configured. Add one with ai.setProvider().");
}
module.exports={setProvider,answer};
