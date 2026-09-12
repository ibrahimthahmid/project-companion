Project Companion
A proof of concept web application for planning, risk tracking and literature
logging in student projects, built for an Open University TM470 project.
Live test deployment: https://project-companion-production.up.railway.app

Important notice
This software is a proof of concept produced for an assessed university
project. It is provided as is, without warranty or support of any kind, and
it is not maintained. The test deployment stores no persistent data and
resets whenever it is redeployed. If you use or extend this code, the data
export feature exists so that no information need ever depend on a single
running instance. Reliance on this software is at your own risk.

Stack
Node.js with Express, EJS server rendered views, SQLite via better-sqlite3.

Running locally
cd project-companion
npm ci
npm start

Then open http://localhost:3000

Licence
MIT. See the LICENSE file.
