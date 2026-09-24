import phone from "@/assets/jangolo-phone.jpg";
import earbuds from "@/assets/jangolo-earbuds.jpg";
import powerbank from "@/assets/jangolo-powerbank.jpg";
import watch from "@/assets/jangolo-watch.jpg";
import sneakers from "@/assets/jangolo-sneakers.jpg";
import fabric from "@/assets/jangolo-fabric.jpg";
import headwrap from "@/assets/jangolo-headwrap.jpg";
import essentials from "@/assets/jangolo-essentials.jpg";

const map: Record<string, string> = {
  "/src/assets/jangolo-phone.jpg": phone,
  "/src/assets/jangolo-earbuds.jpg": earbuds,
  "/src/assets/jangolo-powerbank.jpg": powerbank,
  "/src/assets/jangolo-watch.jpg": watch,
  "/src/assets/jangolo-sneakers.jpg": sneakers,
  "/src/assets/jangolo-fabric.jpg": fabric,
  "/src/assets/jangolo-headwrap.jpg": headwrap,
  "/src/assets/jangolo-essentials.jpg": essentials,
};

export const resolveImg = (url: string) => map[url] ?? url;
