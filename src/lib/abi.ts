// Generated from contracts/out by `npm run abi` — do not edit by hand.
// Source of truth: contracts/src/AnnalBook.sol and contracts/src/AnnalReactive.sol.

export const annalBookAbi = [
  {
    "type": "function",
    "name": "isSource",
    "inputs": [
      {
        "name": "chainId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lineAt",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct AnnalBook.Line",
        "components": [
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "originChainId",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "logIndex",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "originBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "writtenAt",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "amount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "originTxHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lineCount",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "lines",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "offset",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "page",
        "type": "tuple[]",
        "internalType": "struct AnnalBook.Line[]",
        "components": [
          {
            "name": "token",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "originChainId",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "logIndex",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "payer",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "originBlock",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "writtenAt",
            "type": "uint32",
            "internalType": "uint32"
          },
          {
            "name": "amount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "originTxHash",
            "type": "bytes32",
            "internalType": "bytes32"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "open",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "openedAt",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "totalReceived",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "watchingSince",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint64",
        "internalType": "uint64"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "BookOpened",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "LineWritten",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "index",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "originChainId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "originTxHash",
        "type": "bytes32",
        "indexed": false,
        "internalType": "bytes32"
      },
      {
        "name": "logIndex",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "token",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "payer",
        "type": "address",
        "indexed": false,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "WatchingConfirmed",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyOpened",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ]
  }
] as const;

export const annalReactiveAbi = [
  {
    "type": "function",
    "name": "watching",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "Copied",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "originChainId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "originTxHash",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "logIndex",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "Watching",
    "inputs": [
      {
        "name": "owner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  }
] as const;
