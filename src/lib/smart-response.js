const config=require("../config");
const ai=require("./ai");
const {wake,classify,commandCandidate}=require("./smart-bot");
const {dispatch}=require("../handlers/commands");

async function send(sock,jid,text,options={}){return sock.sendMessage(jid,{text},options);}

async function handle(sock,message){
  const context={
    text: require("./helpers").extractText(message),
    mentionedJids: require("./helpers").getMentionedJids(message),
    quotedKey: require("./helpers").getQuotedKey(message),
    botJid:sock?.user?.id||""
  };
  const w=wake(context);
  if(!w.active||!w.text)return {handled:false,reason:"not_awake"};
  const kind=classify(w.text);

  if(kind==="command"){
    const candidate=commandCandidate(w.text);
    const forced=`${config.prefix}${candidate.command}${candidate.args.length?" "+candidate.args.join(" "):""}`;
    const result=await dispatch(sock,message,forced);
    if(result.handled)return {handled:true,type:"command",command:result.command};
    if(result.reason==="unknown_command"){
      await send(sock,message.key.remoteJid,config.smartBot.ai.notAvailableText);
      return {handled:true,type:"unavailable",command:candidate.command};
    }
    return result;
  }

  if(config.smartBot.mode!=="ai")return {handled:false,reason:"command_mode"};
  if(!config.smartBot.ai.enabled)return {handled:false,reason:"ai_disabled"};
  const prompt=w.text.slice(0,config.smartBot.ai.maxPromptLength);
  const jid=message.key.remoteJid;
  const thinking=await send(sock,jid,config.smartBot.ai.thinkingText);
  try{
    const answer=await ai.answer(prompt,{message,context});
    if(!answer)throw new Error("AI provider returned an empty answer.");
    if(thinking?.key)await sock.sendMessage(jid,{text:String(answer)},{edit:thinking.key});
    else await send(sock,jid,String(answer));
    return {handled:true,type:"ai"};
  }catch(error){
    const fallback=`AI is unavailable right now. ${error.message}`;
    if(thinking?.key)await sock.sendMessage(jid,{text:fallback},{edit:thinking.key});
    else await send(sock,jid,fallback);
    return {handled:true,type:"ai_error",error};
  }
}
module.exports={handle};
