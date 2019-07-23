(function clera(){
    if(!pm.environment.has('EncryptionHistory')){
        pm.environment.set('EncryptionHistory', '{}');
    }

    let localStore = JSON.parse(pm.environment.get('EncryptionHistory'));
    Object.keys(localStore).map(key => pm.environment.unset(key));
    pm.environment.unset('EncryptionHistory');
})();
