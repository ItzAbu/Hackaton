// Quiz bank per ogni NPC/argomento.
// Regola: 5 domande, 4 opzioni, 1 corretta.

export const QUIZZES = {
  npc_net: {
    title: "Quiz Reti",
    passCorrect: 4,
    questions: [
      {
        q: "Cosa significa IP?",
        options: ["Internet Protocol", "Internal Process", "Input Port", "Image Packet"],
        correct: 0
      },
      {
        q: "Qual è la porta TCP standard di HTTPS?",
        options: ["21", "80", "443", "3306"],
        correct: 2
      },
      {
        q: "Cos'è un router (in una rete)?",
        options: ["Un dispositivo che collega reti diverse", "Un cavo di rete", "Un antivirus", "Un indirizzo IP"],
        correct: 0
      },
      {
        q: "A cosa serve il DNS?",
        options: ["Tradurre nomi di dominio in indirizzi IP", "Cifrare il traffico", "Misurare la banda", "Bloccare i virus"],
        correct: 0
      },
      {
        q: "In una subnet /24, quanti indirizzi host utilizzabili ci sono?",
        options: ["254", "256", "255", "128"],
        correct: 0
      }
    ]
  },

  npc_sec: {
    title: "Quiz Sicurezza",
    passCorrect: 4,
    questions: [
      {
        q: "Cos'è il phishing?",
        options: ["Un attacco che inganna l'utente per rubare dati", "Un firewall", "Un backup", "Un tipo di cifratura"],
        correct: 0
      },
      {
        q: "Qual è un buon esempio di autenticazione a due fattori (2FA)?",
        options: ["Password + codice OTP", "Solo password", "Solo username", "Password salvata nel browser"],
        correct: 0
      },
      {
        q: "Cosa fa un firewall?",
        options: ["Filtra il traffico in base a regole", "Aumenta la RAM", "Crea domini", "Compila codice"],
        correct: 0
      },
      {
        q: "Cosa indica 'CIA' in sicurezza informatica?",
        options: ["Confidenzialità, Integrità, Disponibilità", "Controllo, Identità, Accesso", "Cloud, Internet, API", "Crittografia, Installazione, Audit"],
        correct: 0
      },
      {
        q: "Quale pratica riduce il rischio di ransomware?",
        options: ["Backup offline e testati", "Aprire allegati sospetti", "Disattivare gli aggiornamenti", "Usare la stessa password ovunque"],
        correct: 0
      }
    ]
  },

  npc_prog: {
    title: "Quiz Programmazione",
    passCorrect: 4,
    questions: [
      {
        q: "Cos'è un ciclo (loop)?",
        options: ["Una struttura che ripete istruzioni", "Un tipo di variabile", "Un file di sistema", "Un driver"],
        correct: 0
      },
      {
        q: "Cosa fa un 'if'?",
        options: ["Esegue codice solo se una condizione è vera", "Crea una classe", "Salva su disco", "Apre una porta"],
        correct: 0
      },
      {
        q: "Qual è lo scopo di una funzione/metodo?",
        options: ["Riutilizzare codice in modo ordinato", "Aumentare la latenza", "Evitare i tipi", "Sostituire il compilatore"],
        correct: 0
      },
      {
        q: "Cosa significa 'debug'?",
        options: ["Trovare e correggere errori", "Cifrare dati", "Inviare email", "Disegnare UI"],
        correct: 0
      },
      {
        q: "Quale tra questi è un tipo di dato booleano?",
        options: ["true/false", "0-255", "\"testo\"", "3.14"],
        correct: 0
      }
    ]
  },

  npc_db: {
    title: "Quiz Database",
    passCorrect: 4,
    questions: [
      {
        q: "A cosa serve una chiave primaria (PRIMARY KEY)?",
        options: ["Identifica univocamente una riga", "Duplica i dati", "Crea un backup", "Cifra una tabella"],
        correct: 0
      },
      {
        q: "Quale query legge dati da una tabella?",
        options: ["SELECT", "INSERT", "DELETE", "DROP"],
        correct: 0
      },
      {
        q: "Cos'è una relazione 1:N?",
        options: ["Una riga in A collegata a molte righe in B", "Molte a molte senza tabella", "Un vincolo di rete", "Un indice"],
        correct: 0
      },
      {
        q: "Cosa fa un indice (INDEX) in un DB?",
        options: ["Accelera alcune ricerche", "Aumenta la dimensione massima RAM", "Blocca accessi", "Trasforma SQL in NoSQL"],
        correct: 0
      },
      {
        q: "Cosa significa 'normalizzazione' (in breve)?",
        options: ["Ridurre ridondanza e anomalie", "Copiare tabelle", "Criptare colonne", "Aumentare il numero di record"],
        correct: 0
      }
    ]
  },

  npc_sys: {
    title: "Quiz Sistemi",
    passCorrect: 4,
    questions: [
      {
        q: "Cosa fa un sistema operativo?",
        options: ["Gestisce hardware, processi e risorse", "È solo un browser", "È un linguaggio", "È un router"],
        correct: 0
      },
      {
        q: "Cos'è una CPU?",
        options: ["Il processore che esegue istruzioni", "Un tipo di RAM", "Un disco", "Un protocollo"],
        correct: 0
      },
      {
        q: "Cos'è la RAM?",
        options: ["Memoria volatile usata dai programmi", "Memoria permanente", "Una scheda di rete", "Un firewall"],
        correct: 0
      },
      {
        q: "Cosa significa 'processo' in un OS?",
        options: ["Un programma in esecuzione", "Un file di log", "Un cavo", "Una tabella SQL"],
        correct: 0
      },
      {
        q: "Cosa indica 'permessi' su un file?",
        options: ["Chi può leggere/scrivere/eseguire", "Quanta banda usa", "Quanta RAM ha", "Che IP possiede"],
        correct: 0
      }
    ]
  },

  npc_cld: {
    title: "Quiz Cloud",
    passCorrect: 4,
    questions: [
      {
        q: "Cos'è il Cloud (in generale)?",
        options: ["Risorse IT erogate via Internet", "Un antivirus", "Un cavo", "Un sistema operativo"],
        correct: 0
      },
      {
        q: "Esempio di SaaS:",
        options: ["Google Docs", "Una VM su un hypervisor", "Un router fisico", "Un cavo RJ45"],
        correct: 0
      },
      {
        q: "Cosa significa IaaS?",
        options: ["Infrastructure as a Service", "Identity as a System", "Internet as a Switch", "Instance as a Storage"],
        correct: 0
      },
      {
        q: "Cos'è la scalabilità nel cloud?",
        options: ["Aumentare/diminuire risorse in base al carico", "Cambiare DNS", "Criptare file", "Bloccare porte"],
        correct: 0
      },
      {
        q: "Qual è un vantaggio tipico del cloud?",
        options: ["Pagamento a consumo e rapidità di provisioning", "Obbligo di hardware proprietario", "Zero dipendenza da Internet", "Costi sempre fissi"],
        correct: 0
      }
    ]
  }
};
