import { Transaction, Account } from '../types';

const SYNC_CONFIG_KEY = 'smartspend_sheets_sync_v1';

export interface SyncConfig {
  url: string;
  lastSynced?: string;
}

export const getSyncConfig = (): SyncConfig | null => {
  const stored = localStorage.getItem(SYNC_CONFIG_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveSyncConfig = (config: SyncConfig) => {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
};

export const clearSyncConfig = () => {
  localStorage.removeItem(SYNC_CONFIG_KEY);
};

export const pushToSheets = async (transactions: Transaction[], accounts: Account[]): Promise<boolean> => {
  const config = getSyncConfig();
  if (!config || !config.url) return false;

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      mode: 'no-cors', // Apps Script Web Apps often require no-cors or simple requests
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'push',
        transactions,
        accounts
      }),
    });
    
    // With no-cors we can't read the response, but if it doesn't throw, it likely reached the script
    saveSyncConfig({ ...config, lastSynced: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Push to Sheets failed:', error);
    return false;
  }
};

export const pullFromSheets = async (): Promise<{ transactions: Transaction[], accounts: Account[] } | null> => {
  const config = getSyncConfig();
  if (!config || !config.url) return null;

  try {
    const response = await fetch(`${config.url}?action=pull`);
    if (!response.ok) throw new Error('Pull failed');
    const data = await response.json();
    
    if (data && data.transactions && data.accounts) {
       saveSyncConfig({ ...config, lastSynced: new Date().toISOString() });
       return data;
    }
    return null;
  } catch (error) {
    console.error('Pull from Sheets failed:', error);
    return null;
  }
};

export const GOOGLE_APPS_SCRIPT_CODE = `
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'pull') {
    var txSheet = ss.getSheetByName("Transactions");
    var accSheet = ss.getSheetByName("Accounts");
    
    var transactions = [];
    if (txSheet) {
      var data = txSheet.getDataRange().getValues();
      var headers = data.shift();
      transactions = data.map(function(row) {
        return {
          id: row[0],
          date: row[1],
          amount: Number(row[2]),
          type: row[3],
          category: row[4],
          description: row[5],
          accountId: row[6],
          targetAccountId: row[7] || undefined
        };
      });
    }

    var accounts = [];
    if (accSheet) {
      var data = accSheet.getDataRange().getValues();
      var headers = data.shift();
      accounts = data.map(function(row) {
        return {
          id: row[0],
          name: row[1],
          emoji: row[2]
        };
      });
    }

    return ContentService.createTextOutput(JSON.stringify({
      transactions: transactions,
      accounts: accounts
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  var payload = JSON.parse(e.postData.contents);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (payload.action === 'push') {
    // Transactions
    var txSheet = ss.getSheetByName("Transactions") || ss.insertSheet("Transactions");
    txSheet.clear();
    txSheet.appendRow(["ID", "Date", "Amount", "Type", "Category", "Description", "AccountId", "TargetAccountId"]);
    payload.transactions.forEach(function(t) {
      txSheet.appendRow([t.id, t.date, t.amount, t.type, t.category, t.description, t.accountId, t.targetAccountId || ""]);
    });
    
    // Accounts
    var accSheet = ss.getSheetByName("Accounts") || ss.insertSheet("Accounts");
    accSheet.clear();
    accSheet.appendRow(["ID", "Name", "Emoji"]);
    payload.accounts.forEach(function(a) {
      accSheet.appendRow([a.id, a.name, a.emoji]);
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({status: "success"}))
    .setMimeType(ContentService.MimeType.JSON);
}
`;