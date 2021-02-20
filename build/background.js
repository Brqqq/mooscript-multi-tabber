import"./lib/moment.js";import"./lib/moment-timezone.js";import{doSmallCrime}from"./actions/smallcrime.js";import{removeAccount,updateAccount,addAccount,updateEveryAccount,resetDrugRun,getFromStorage,setInStorage,initStorage,getAccounts}from"./storage.js";import{doGta}from"./actions/carstealing.js";import{sellCars}from"./actions/carseller.js";import{findDrugRun}from"./actions/drugrunfinder.js";import{doDrugDeal}from"./actions/drugdealing.js";import{createLead}from"./actions/leadcreation.js";import{collectWill}from"./actions/willcollector.js";import{isDead,getDoc,isLoggedOut,isInJail,postForm,sleep}from"./actions/utils.js";import{Routes}from"./actions/routes.js";import{savePlayerInfo}from"./actions/saveplayerinfo.js";import{buyItems}from"./actions/buyitems.js";import{doJailbust}from"./actions/jailbuster.js";chrome.browserAction.onClicked.addListener((()=>{chrome.tabs.create({url:"index.html"})}));let mobAuths={};window.currentCookie="";let manualLoginRequestId="";chrome.webRequest.onBeforeSendHeaders.addListener((function(e){if(e.url.includes("mooscript=true")&&(manualLoginRequestId=e.requestId),manualLoginRequestId===e.requestId||e.url.includes("mooscript=true")||null==e.initiator||!e.initiator.includes("chrome-extension://"))return{requestHeaders:e.requestHeaders};for(var o=0;o<e.requestHeaders.length;o++)if("Cookie"===e.requestHeaders[o].name){e.requestHeaders[o].value=window.currentCookie;break}return{requestHeaders:e.requestHeaders}}),{urls:["https://www.mobstar.cc/*"]},["blocking","requestHeaders","extraHeaders"]),chrome.webRequest.onHeadersReceived.addListener((e=>{if(e.url.includes("mooscript=true")||null==e.initiator||!e.initiator.includes("chrome-extension://"))return{responseHeaders:e.responseHeaders};const o=e.responseHeaders.filter((e=>"Set-Cookie"===e.name&&e.value.includes("MOBSTAR_AUTH")));if(0===o.length)return{responseHeaders:e.responseHeaders};const t=o.find((e=>!e.value.includes("deleted")));if(t){const e=t.value.split(";");window.currentCookie=e[0]}else window.currentCookie="";return e.responseHeaders=e.responseHeaders.filter((e=>"Set-Cookie"!==e.name)),{responseHeaders:e.responseHeaders}}),{urls:["https://www.mobstar.cc/*"]},["blocking","responseHeaders","extraHeaders"]);var fetchMobAuth=async(e,o)=>{const t=await postForm(Routes.Login,`email=${encodeURIComponent(e)}&password=${encodeURIComponent(o)}`,{disableSanitize:!0});return!isLoggedOut(t.result)&&window.currentCookie};window.fetchMobAuth=fetchMobAuth;const useAuthToken=e=>{const o=mobAuths[e];return new Promise(((e,t)=>{if(null!=o)try{chrome.cookies.set({url:"https://www.mobstar.cc",domain:".mobstar.cc",name:"MOBSTAR_AUTH",value:o.split("=")[1]},(o=>{e()}))}catch(a){t(a)}else t("Not logged in")}))};window.useAuthToken=useAuthToken,window.addAccount=addAccount,window.removeAccount=removeAccount,window.updateAccount=updateAccount,window.updateEveryAccount=updateEveryAccount,window.setInStorage=setInStorage,window.resetDrugRun=resetDrugRun;const gameLoop=async(e,o)=>{let t=new Date;for(;;){await e();const a=1e3*o-((new Date).valueOf()-t.valueOf());a>0?await new Promise((e=>setTimeout(e,a))):console.log("Loop took a little longer than expected..."),t=new Date}},performAction=(e,o,t)=>t+o<(new Date).valueOf()&&e(),start=async()=>{await initStorage();const e={};gameLoop((async()=>{const o=getAccounts();for(let n of Object.keys(o)){const r=o[n];if(!r.active)continue;let s=e[n];null==s&&(s={lastSmallCrime:0,smallCrimeCooldown:0,lastGta:0,gtaCooldown:0,lastCarSelling:0,carSellingCooldown:0,lastLeadCreation:0,leadCreationCooldown:0,lastDrugDeal:0,drugDealingCooldown:0,lastDrugFind:0,drugFindCooldown:0,lastJailBust:0,jailBustCooldown:0,lastPlayerSaved:0,playerSaveCooldown:0,lastItemsBought:0,itemBuyingCooldown:0,hasCheckedWill:!1},e[n]=s);let i=mobAuths[n];try{if(null==i){if(i=await fetchMobAuth(n,r.password),!i){await updateAccount(n,{invalidPassword:!0,active:!1});continue}mobAuths[n]=i,r.invalidPassword&&await updateAccount(n,{invalidPassword:!1})}if(window.currentCookie=i,s.hasCheckedWill||(await collectWill(),s.hasCheckedWill=!0),r.enableSmallCrime){const e=await performAction(doSmallCrime,s.smallCrimeCooldown,s.lastSmallCrime);e&&(s.smallCrimeCooldown=e,s.lastSmallCrime=(new Date).valueOf())}if(r.enableGta){const e=await performAction(doGta,s.gtaCooldown,s.lastGta);e&&(s.gtaCooldown=e,s.lastGta=(new Date).valueOf())}if(r.enableCarSelling){const e=await performAction(sellCars,s.carSellingCooldown,s.lastCarSelling);e&&(s.carSellingCooldown=e,s.lastCarSelling=(new Date).valueOf())}if(r.enableItemBuying){const e=await performAction(buyItems,s.itemBuyingCooldown,s.lastItemsBought);e&&(s.itemBuyingCooldown=e,s.lastItemsBought=(new Date).valueOf())}const e=await performAction(createLead,s.leadCreationCooldown,s.lastLeadCreation);if(e&&(s.leadCreationCooldown=e,s.lastLeadCreation=(new Date).valueOf()),r.enableDrugRunning){const e=await performAction(doDrugDeal,s.drugDealingCooldown,s.lastDrugDeal);e&&(s.drugDealingCooldown=e,s.lastDrugDeal=(new Date).valueOf())}if(r.enableDrugRunFinding){const e=await performAction(findDrugRun,s.drugFindCooldown,s.lastDrugFind);e&&(s.drugFindCooldown=e,s.lastDrugFind=(new Date).valueOf())}const o=await performAction(savePlayerInfo,s.playerSaveCooldown,s.lastPlayerSaved);if(o&&(s.playerSaveCooldown=o,s.lastPlayerSaved=(new Date).valueOf()),r.enableJailbusting){const e=await performAction(doJailbust,s.jailBustCooldown,s.lastJailBust);e&&(s.jailBustCooldown=e,s.lastJailBust=(new Date).valueOf())}await sleep(1e3)}catch(t){let e;try{e=await getDoc(Routes.TestPage)}catch(a){console.log("Error with connecting to mobstar"),console.log("Initial error"),console.error(t),console.log("Mobstar connection exception"),console.error(a),await sleep(5e3);continue}isDead(e.document)?await updateAccount(n,{isDead:!0,active:!1}):isLoggedOut(e.result)?(i=await fetchMobAuth(n,r.password),i?(mobAuths[n]=i,r.invalidPassword&&await updateAccount(n,{invalidPassword:!1})):await updateAccount(n,{invalidPassword:!0,active:!1})):isInJail(e.result)||(console.error("Unknown error with user: "+n),console.error(t),console.error(e))}}}),30)};start();