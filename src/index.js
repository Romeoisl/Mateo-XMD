const config=require("./config");
const {banner,log,error}=require("./lib/logger");
const {startMonitor,stopMonitor}=require("./lib/monitor");
const {stopAll}=require("./lib/scheduler");
const database=require("./lib/database");
const {connectWhatsApp,shutdown}=require("./connection/whatsapp");
let stopping=false;
async function start(){
  config.loadConfig();
  await database.init(config);
  banner(config);
  log(`Database initialized: ${database.type()}`);
  process.on("uncaughtException",e=>error("Uncaught exception:",e));
  process.on("unhandledRejection",e=>error("Unhandled rejection:",e));
  const stop=async s=>{
    if(stopping)return;
    stopping=true;
    stopMonitor();
    stopAll();
    await shutdown(s);
    await database.closeDatabase();
  };
  process.once("SIGINT",()=>stop("SIGINT"));
  process.once("SIGTERM",()=>stop("SIGTERM"));
  startMonitor();
  await connectWhatsApp();
  log("Core initialized successfully.");
}
start().catch(async e=>{
  error("Startup failed:",e);
  try{await database.closeDatabase()}catch{}
  process.exitCode=1;
});
