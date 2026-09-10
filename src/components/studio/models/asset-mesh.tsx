import type { MeshViewProps } from "@/lib/studio/types";
import { BuildingMesh } from "./building";
import { FurnitureMesh } from "./furniture";
import { NatureMesh } from "./nature";
import { PrimitiveMesh } from "./primitives";
import { PropMesh } from "./props";
import { VehicleMesh } from "./vehicle";

export function AssetMesh(props: MeshViewProps) {
  const { kind } = props;
  switch (kind) {
    case "sports-car":
    case "sedan":
    case "suv":
    case "pickup":
    case "van":
      return <VehicleMesh {...props} />;
    case "modern-house":
    case "cottage":
    case "cabin":
    case "tower":
    case "shop":
      return <BuildingMesh {...props} />;
    case "oak":
    case "pine":
    case "palm":
    case "willow":
    case "rock":
      return <NatureMesh {...props} />;
    case "chair":
    case "table":
    case "sofa":
    case "lamp":
    case "shelf":
      return <FurnitureMesh {...props} />;
    case "crate":
    case "barrel":
    case "traffic-cone":
    case "hydrant":
    case "vase":
      return <PropMesh {...props} />;
    default:
      return <PrimitiveMesh {...props} />;
  }
}
