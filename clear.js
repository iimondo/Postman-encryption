if(!pm.environment.has('localStore')){
    pm.environment.set('localStore', '{}');
}

let localStore = JSON.parse(pm.environment.get('localStore'));
Object.keys(localStore).map(key => pm.environment.unset(key));
pm.environment.unset('localStore');
