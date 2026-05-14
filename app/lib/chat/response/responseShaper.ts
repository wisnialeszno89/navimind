type ShapeInput = {
  text: string;
};

export function shapeResponse({
  text,
}: ShapeInput) {
  return {
    text: text.trim(),
    usedEffect: null,
  };
}