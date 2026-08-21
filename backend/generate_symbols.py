import os
from PIL import Image, ImageDraw

out_dir = r"d:\flutterAhmadZulveron\Try\backend\symbols"
os.makedirs(out_dir, exist_ok=True)

def new_img():
    return Image.new('RGBA', (100, 60), (255, 255, 255, 0))

def draw_rect(d, xy, width=2):
    d.rectangle(xy, outline="black", width=width)

# Use Case
img = Image.new('RGBA', (40, 80), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
d.ellipse([10, 5, 30, 25], outline="black", width=2) # head
d.line([20, 25, 20, 50], fill="black", width=2) # body
d.line([5, 35, 35, 35], fill="black", width=2) # arms
d.line([20, 50, 10, 75], fill="black", width=2) # left leg
d.line([20, 50, 30, 75], fill="black", width=2) # right leg
img.save(os.path.join(out_dir, "actor.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.ellipse([5, 10, 95, 50], outline="black", width=2)
img.save(os.path.join(out_dir, "use_case.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.line([10, 30, 90, 30], fill="black", width=2)
img.save(os.path.join(out_dir, "association.png"))

# Sequence
img = new_img()
d = ImageDraw.Draw(img)
d.rectangle([10, 10, 90, 50], outline="black", width=2)
img.save(os.path.join(out_dir, "object_box.png"))

img = Image.new('RGBA', (40, 80), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
for y in range(5, 75, 10):
    d.line([20, y, 20, y+5], fill="black", width=2)
img.save(os.path.join(out_dir, "lifeline.png"))

img = Image.new('RGBA', (40, 80), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
d.rectangle([10, 10, 30, 70], outline="black", width=2)
img.save(os.path.join(out_dir, "activation_box.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.line([10, 30, 80, 30], fill="black", width=2)
d.polygon([80, 25, 90, 30, 80, 35], fill="black")
img.save(os.path.join(out_dir, "sync_message.png"))

img = new_img()
d = ImageDraw.Draw(img)
for x in range(20, 90, 10):
    d.line([x, 30, x+5, 30], fill="black", width=2)
d.line([10, 30, 20, 25], fill="black", width=2)
d.line([10, 30, 20, 35], fill="black", width=2)
img.save(os.path.join(out_dir, "return_message.png"))

# Activity
img = new_img()
d = ImageDraw.Draw(img)
d.ellipse([30, 10, 70, 50], fill="black")
img.save(os.path.join(out_dir, "initial_node.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.rounded_rectangle([10, 10, 90, 50], radius=15, outline="black", width=2)
img.save(os.path.join(out_dir, "activity.png"))

img = Image.new('RGBA', (40, 80), (255, 255, 255, 0))
d = ImageDraw.Draw(img)
d.line([20, 10, 20, 60], fill="black", width=2)
d.polygon([15, 60, 25, 60, 20, 70], fill="black")
img.save(os.path.join(out_dir, "control_flow.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.polygon([50, 5, 80, 30, 50, 55, 20, 30], outline="black", width=2)
img.save(os.path.join(out_dir, "decision.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.ellipse([30, 10, 70, 50], outline="black", width=2)
d.ellipse([40, 20, 60, 40], fill="black")
img.save(os.path.join(out_dir, "final_node.png"))

# Flowchart
img = new_img()
d = ImageDraw.Draw(img)
d.rounded_rectangle([10, 10, 90, 50], radius=20, outline="black", width=2)
img.save(os.path.join(out_dir, "terminator.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.rectangle([10, 10, 90, 50], outline="black", width=2)
img.save(os.path.join(out_dir, "process.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.polygon([30, 10, 80, 10, 70, 50, 20, 50], outline="black", width=2)
img.save(os.path.join(out_dir, "io.png"))

img = new_img()
d = ImageDraw.Draw(img)
d.rectangle([10, 10, 90, 50], outline="black", width=2)
d.line([20, 10, 20, 50], fill="black", width=2)
d.line([80, 10, 80, 50], fill="black", width=2)
img.save(os.path.join(out_dir, "predefined.png"))

print("Symbols generated.")
