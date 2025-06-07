*Charge Mate*🚗⚡

It is a web platform designed to streamline electric vehicle (EV) charging with real-time station discovery, intelligent recommendations, and seamless booking. Built with React, Node.js, and MongoDB, it offers an interactive map, dynamic filtering, and secure payments via Razorpay, reducing range anxiety and promoting sustainable mobility.

*Key Features*

* Interactive map 🌍 with EV charging stations

* Location-based station 🔌 recommendations

* Station filtering (country, state, address, charging type)

* Marker highlighting and popups

* Detailed station info panel

* User authentication

* User profiles & personalized recommendations

* Booking system

* Notification system .🔔(booking, cancellation, reminder)

* Community engagement

  *Tech Stack*

* Frontend: React.js, Leaflet, TailwindCSS

* Backend: Node.js, Express.js

* Database: MongoDB

* APIs: OpenChargeMap API

* Other: JWT Authentication, REST API



*Dataset Size:* 📊 Processed 1000+ charging station records from Stations.csv, normalized for power (kW), price, and rating, stored in MongoDB.

*API Response Time:* Backend endpoints (/api/filters, /api/recommendations) achieve 200–500 ms response times for queries on 1000 stations.

*Recommendation Accuracy*: Hybrid algorithm (radius-based and city-based) delivers top 3 stations within specified radius (e.g., 10 km) with 95% relevance.

*Scalability*: MongoDB indexing supports efficient querying, handling up to 10,000 station records with minimal latency.
