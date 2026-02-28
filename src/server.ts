import app from "./app"; // Endpoints root
import '../utils/env-config'; // Environment variable

app.listen(process.env.PORT, () => {

      console.log("listening on port " + process.env.PORT);
});