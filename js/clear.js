// 清空加密产生的变量
(function clera(){
    if(!pm.environment.has('HistoryTrace')){
        pm.environment.set('HistoryTrace', '{}');
    }

    let localStore = JSON.parse(pm.environment.get('HistoryTrace'));
    Object.keys(localStore).map(key => pm.environment.unset(key));
    pm.environment.unset('HistoryTrace');
})();