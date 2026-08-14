const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const rootFile=path.join(root,"config.json");
const botFile=path.join(root,"config","bot.json");
function read(file){try{return JSON.parse(fs.readFileSync(file,"utf8"))}catch{return {}}}
const base=read(rootFile), bot=read(botFile);
const c={...base,...bot};
const db=c.database||{};
const config={
  name:String(c.botName||"XMD WhatsApp Bot"),
  version:"1.0.0",
  prefix:String(c.prefix||"."),
  publicMode:c.publicMode!==false && c.mode!=="private",
  ownerNumbers:Array.isArray(c.ownerNumbers)?c.ownerNumbers.map(String):[],
  pairingCode:Boolean(c.pairingCode),
  pairingNumber:String(process.env.PAIRING_NUMBER||c.pairingNumber||""),
  sessionDir:path.resolve(root,c.sessionDir||"session"),
  mediaDir:path.resolve(root,c.mediaDir||"media"),
  database:{
    type:String(db.type||"json").toLowerCase(),
    json:{file:path.resolve(root,db.json?.file||c.databaseFile||"src/database/data.json")},
    sqlite:{file:path.resolve(root,db.sqlite?.file||"src/database/xmd.sqlite")},
    mongodb:{
      uri:String(process.env.MONGODB_URI||db.mongodb?.uri||""),
      dbName:String(process.env.MONGODB_DB||db.mongodb?.dbName||"xmd")
    }
  },
  databaseFile:path.resolve(root,db.json?.file||c.databaseFile||"src/database/data.json"),
  mediaCleanupMinutes:Number(c.mediaCleanupMinutes||30),
  logLevel:String(process.env.LOG_LEVEL||c.logLevel||"info")
};
function validateConfig(){
  const e=[];
  if(!config.prefix)e.push("prefix cannot be empty");
  if(config.pairingCode&&!config.pairingNumber)e.push("pairingNumber is required when pairingCode is enabled");
  if(!["json","sqlite","mongodb"].includes(config.database.type))e.push("database.type must be json, sqlite, or mongodb");
  if(config.database.type==="mongodb"&&!config.database.mongodb.uri)e.push("database.mongodb.uri or MONGODB_URI is required when MongoDB is selected");
  return e;
}
function ensureDirectories(){
  const dbDir=config.database.type==="sqlite"?path.dirname(config.database.sqlite.file):path.dirname(config.database.json.file);
  [config.sessionDir,config.mediaDir,dbDir,path.dirname(botFile)].forEach(d=>fs.mkdirSync(d,{recursive:true}));
}
function loadConfig(){const e=validateConfig();if(e.length)throw Error(e.join("; "));ensureDirectories();return config}
module.exports={...config,validateConfig,ensureDirectories,loadConfig};
