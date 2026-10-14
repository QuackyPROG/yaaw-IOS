# Testing expertise

Choose the cheapest verification layer that proves the requirement, then add stronger layers where risk demands it:

1. static/type/lint/config/Expo Doctor;
2. unit;
3. component/router integration;
4. E2E;
5. EAS iOS simulator;
6. physical iPhone.

Hardware-sensitive behavior is not proven by a simulator alone. A local Jest pass is not "tested on iOS."
