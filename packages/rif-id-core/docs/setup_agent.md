# Setup uPort DAF agent

The agent will take care of all DID, JWT and W3C operations. To use RIF Identity library we **hardly recommend** to use this setup for the agent.

The agent has 6 principal modules
- The _database connection_ (if you didn't setup the database please follow [this guide](./setup_db))
- A _key management system_ responsible for creating, deleting and exporting keys. The key management system has an implementation for common JS, and an implementation for React Native - if you are using React Native please take care of this.
- A DID Resolver that will resolve and verify all DID Documents for incoming and outgoing W3C Credentials and Presentations
- One or more _identity providers_ that control user's Identity - for example, for Ethr DID identities it is capable of creating identities, delegating identities and transferring ownership of them.
- A chain of _message handlers_ that will take care of all incoming communications. This communications can contain credentials, selective disclosures requests and others.
- A chain of _action handlers_ that perform requested operations like signing JWTs or sending messages to other DAF Agents

RIF Identity makes use of a set of this modules to perform different standard operations. We **hardly recommend** to use this setup for the agent.

For React Native use `daf-react-native-libsodium` implementation

TBD
