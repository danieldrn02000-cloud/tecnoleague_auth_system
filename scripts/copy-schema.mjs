import {copyFileSync} from 'node:fs';
copyFileSync('src/schema.graphql', 'dist/schema.graphql');
