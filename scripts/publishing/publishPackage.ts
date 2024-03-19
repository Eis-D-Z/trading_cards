import { execSync } from "child_process";
import {constants} from "../constants";
import {updateConstants} from "../utils";
import * as fs from "fs";


const publish = () => {
    const network = constants["network"];

    execSync(`bash publish.sh ${network}`, { stdio: 'inherit' });
}

const parsePublishJson = () => {
  const raw = fs.readFileSync("publish.json");
  const result: any = JSON.parse(raw.toString());
  if (!result.digest) {
    throw new Error("Make sure to run publish.sh first");
  }

  result.objectChanges.forEach((obj: any) => {
    if (obj.type === "published") {
      constants["packageId"] = obj.packageId;
    } else if (obj.type === "created") {
      if (obj.objectType.includes("Publisher")) {
        constants["publisher"] = obj.objectId;
      }
      if (obj.objectType.includes("AdminCap")) {
        constants["adminCap"] = obj.objectId;
      }
      if (obj.objectType.includes("Central")) {
        constants["centralObj"] = obj.objectId;
      }
      if (obj.objectType.includes("Kiosk")) {
        constants["kiosk"] = obj.objectId;
      }
    }
  });

};


// Here one can add more logic, whether to publish each time or not, etc...
publish();
parsePublishJson();
updateConstants(constants);
