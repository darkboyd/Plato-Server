
import * as firebase from '../lib/firebase.js'
const fb = new firebase();
exports.handler = async function(change, context) {
    const restID = context.params.restID;
    const data = change.data();
    fb.messaging.sendToTopic(restID, 
    {notification: {
        title: data.title,
        body: data.body,
        click_action: data.url,
        icon: data.icon
      }}).then(function(){
          console.log('succes');
          return 0;
      }).catch(err => {
        console.error(err);
      });
}
