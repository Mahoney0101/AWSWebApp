import React, { useState, useEffect } from 'react';
import './App.css';
import Amplify, { API, graphqlOperation, Auth } from 'aws-amplify';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';
import { listShoppingItems, } from './graphql/queries';
import { createShoppingItem , deleteShoppingItem } from './graphql/mutations';
import { onCreateShoppingItem, onDeleteShoppingItem } from './graphql/subscriptions';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);

Auth.configure(awsconfig);

const initialFormState = { name: '', amount: '' }

function App() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchItems();
    subscribeToItem(items);
    subscribeToDeleteItem();
    
  }, []);//eslint-disable-line react-hooks/exhaustive-deps

  async function fetchItems() {
    const apiData = await API.graphql({ query: listShoppingItems });
    setItems(apiData.data.listShoppingItems.items);
  }
  
  async function createItem() {
    if (!formData.name || !formData.amount) return;
    await API.graphql({ query: createShoppingItem, variables: { input: formData } });
    setFormData(initialFormState);
  }

  async function deleteItem({ id }) {
    await API.graphql({ query: deleteShoppingItem, variables: { input: { id } }});
  }

  async function subscribeToDeleteItem() {
    await API.graphql(graphqlOperation(onDeleteShoppingItem))
    .subscribe({
      next: event => {
        if (event){
          fetchItems();
        }
      }
    });
  }

  async function subscribeToItem(items) {
    await API.graphql(graphqlOperation(onCreateShoppingItem))
    .subscribe({
      next: event => {
        if (event){
          fetchItems();
        }
      }
    });
  }

  return (
    <div className="App">
      <div className="top">
      <h1>Log a Bug or TODO</h1>
      </div>
      <div className="bugform">
        <h2>Create Issue</h2>
        <div className="formpadding">
      <input 
        onChange={e => setFormData({ ...formData, 'name': e.target.value})}
        placeholder="Type"
        value={formData.name}
      /></div><br/>
      <div className="formpadding">
      <input
        onChange={e => setFormData({ ...formData, 'amount': e.target.value})}
        placeholder="Details"
        value={formData.amount}
      /></div><br/>
      <button onClick={createItem}>Create Bug Log</button>
      </div>
      <div style={{marginBottom: 30}}>
        {
          items.map(item => (
            <div key={item.id || item.name}>
              <h2>{item.name}</h2>
              <p>{item.amount}</p>
              <button onClick={() => deleteItem(item)}>Remove bug</button>
            </div>
          ))
        }
      </div>
      <div className="bottom">
      <AmplifySignOut />
      </div>
    </div>
  );
}

export default withAuthenticator(App);
