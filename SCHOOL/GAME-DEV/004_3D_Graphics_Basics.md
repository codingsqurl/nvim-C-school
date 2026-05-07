# 004_3D_Graphics_Basics

> Meshes, shaders, lighting, cameras, and OpenGL introduction.

## Level 1 — Intuition

### Concept

3D graphics is about taking a mathematical description of a scene (points in 3D space) and turning it into pixels on a 2D screen. This happens through a pipeline of transformations.

### The 3D Pipeline in One Picture

```
3D World → Camera sees → Project onto screen → Color pixels
   │            │               │                  │
 Model        View          Projection         Fragment
 Space        Space         Space              Shading
```

### Meshes

```
A mesh is a collection of triangles:

    v0──────v1        Triangle = 3 vertices
    │╲      │         Each vertex has:
    │  ╲    │         - Position (x,y,z)
    │    ╲  │         - Normal (which way it faces)
    │      ╲│         - UV (texture coordinate)
    v2──────v3

Why triangles? They're always flat, always convex, GPUs love them.
```

## Level 2 — Practical

### OpenGL "Hello Triangle"

```c
// Minimal OpenGL setup (using GLFW + glad)
#include <glad/glad.h>
#include <GLFW/glfw3.h>

// Vertex shader: transforms vertices
const char *vertex_shader_src =
"#version 330 core\n"
"layout(location = 0) in vec3 aPos;\n"
"void main() {\n"
"    gl_Position = vec4(aPos, 1.0);\n"
"}\0";

// Fragment shader: colors pixels
const char *fragment_shader_src =
"#version 330 core\n"
"out vec4 FragColor;\n"
"void main() {\n"
"    FragColor = vec4(1.0, 0.5, 0.2, 1.0);\n"  // Orange
"}\0";

int main() {
    glfwInit();
    GLFWwindow *window = glfwCreateWindow(800, 600, "Triangle", NULL, NULL);
    glfwMakeContextCurrent(window);
    gladLoadGLLoader((GLADloadproc)glfwGetProcAddress);

    // Triangle vertices
    float vertices[] = {
        -0.5f, -0.5f, 0.0f,  // bottom-left
         0.5f, -0.5f, 0.0f,  // bottom-right
         0.0f,  0.5f, 0.0f   // top
    };

    unsigned int VBO, VAO;
    glGenVertexArrays(1, &VAO);
    glGenBuffers(1, &VBO);

    glBindVertexArray(VAO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices,
                 GL_STATIC_DRAW);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE,
                          3 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(0);

    // Compile shaders (omitted for brevity — see exercises)
    unsigned int shader_program = create_shader_program(
        vertex_shader_src, fragment_shader_src);

    while (!glfwWindowShouldClose(window)) {
        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT);

        glUseProgram(shader_program);
        glBindVertexArray(VAO);
        glDrawArrays(GL_TRIANGLES, 0, 3);

        glfwSwapBuffers(window);
        glfwPollEvents();
    }
    glfwTerminate();
    return 0;
}
```

### Transformations with Matrices

```c
// Model-View-Projection (MVP) matrix
// Using a math library like cglm or glm

/*
// 1. Model matrix: where in the world
mat4 model = GLM_MAT4_IDENTITY_INIT;
glm_translate(model, (vec3){2.0f, 0.0f, -5.0f});
glm_rotate(model, glm_rad(angle), (vec3){0.0f, 1.0f, 0.0f});

// 2. View matrix: where the camera is
mat4 view;
glm_lookat(view,
    (vec3){0.0f, 2.0f, 5.0f},   // Camera position
    (vec3){0.0f, 0.0f, 0.0f},   // Look at origin
    (vec3){0.0f, 1.0f, 0.0f});  // Up vector

// 3. Projection matrix: perspective
mat4 projection;
glm_perspective(glm_rad(45.0f),  // FOV
    800.0f / 600.0f,             // Aspect ratio
    0.1f, 100.0f);               // Near/Far planes

// Combine
mat4 mvp;
glm_mat4_mul(projection, view, mvp);
glm_mat4_mul(mvp, model, mvp);
// Upload mvp to shader: glUniformMatrix4fv(loc, 1, GL_FALSE, mvp[0]);
*/
```

## Level 3 — Systems

### Lighting Models

```glsl
// Phong Lighting in fragment shader
// Ambient + Diffuse + Specular = Final Color

#version 330 core
in vec3 FragPos;
in vec3 Normal;

uniform vec3 lightPos;
uniform vec3 viewPos;
uniform vec3 lightColor;
uniform vec3 objectColor;

out vec4 FragColor;

void main() {
    // Ambient: constant light everywhere (prevents pure black)
    float ambientStrength = 0.1;
    vec3 ambient = ambientStrength * lightColor;

    // Diffuse: light intensity depends on angle to surface
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor;

    // Specular: shiny highlights
    float specularStrength = 0.5;
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
    vec3 specular = specularStrength * spec * lightColor;

    vec3 result = (ambient + diffuse + specular) * objectColor;
    FragColor = vec4(result, 1.0);
}
```

### Camera Systems

```c
// FPS-style camera with mouse look
typedef struct {
    vec3 position;
    vec3 front;    // direction looking
    vec3 up;       // world up
    float yaw;     // horizontal rotation
    float pitch;   // vertical rotation
} Camera;

void update_camera_vectors(Camera *cam) {
    vec3 direction;
    direction[0] = cosf(glm_rad(cam->yaw)) * cosf(glm_rad(cam->pitch));
    direction[1] = sinf(glm_rad(cam->pitch));
    direction[2] = sinf(glm_rad(cam->yaw)) * cosf(glm_rad(cam->pitch));
    glm_vec3_normalize(direction);
    glm_vec3_copy(direction, cam->front);
}

void camera_move(Camera *cam, vec3 direction, float delta_time) {
    float velocity = 5.0f * delta_time;
    // Move along camera-relative axes
    vec3 movement;
    glm_vec3_scale(cam->front, direction[2] * velocity, movement);
    cam->position[0] += movement[0];
    cam->position[1] += movement[1];
    cam->position[2] += movement[2];
    // Strafe: cross product of front and up gives right vector
}
```

### Texture Mapping

```c
// Loading and applying textures
// Using stb_image.h for loading

/*
int width, height, nrChannels;
unsigned char *data = stbi_load("container.jpg",
    &width, &height, &nrChannels, 0);

unsigned int texture;
glGenTextures(1, &texture);
glBindTexture(GL_TEXTURE_2D, texture);

glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0,
    GL_RGB, GL_UNSIGNED_BYTE, data);
glGenerateMipmap(GL_TEXTURE_2D);

stbi_image_free(data);

// In shader:
// uniform sampler2D ourTexture;
// FragColor = texture(ourTexture, TexCoord);
*/
```

## Level 4 — Expert

### Deferred Rendering

```
Forward Rendering:                  Deferred Rendering:
For each object:                    Pass 1: Write to G-Buffer
  For each light:                     Position | Normal | Albedo | Specular
    Shade pixel                       (Multiple render targets)
  → O(objects × lights)            Pass 2: For each light:
                                      Read G-Buffer, shade full-screen quad
                                    → O(objects + lights)
                                    → MUCH faster with many lights
```

### Modern Graphics APIs

| API | Style | Platform | Difficulty |
|-----|-------|----------|------------|
| OpenGL 4.x | State machine | Cross-platform | Beginner-friendly |
| Vulkan | Explicit, low-level | Cross-platform | Expert |
| DirectX 12 | Explicit, low-level | Windows/Xbox | Expert |
| Metal | Modern, Apple-only | macOS/iOS | Intermediate |
| WebGPU | Modern, portable | Browser/native | Intermediate |

---

## Exercises

1. Set up GLFW + glad/glad2. Render a colored triangle. Then make it rotate using a model matrix and `glm_rotate`.
2. Add a simple Phong shader to light a cube. Add keyboard controls to move the light position and observe diffuse + specular changing.
3. Load a texture with stb_image and map it onto a quad. Add a second texture and blend them in the fragment shader.

## Quiz

1. What are the three matrices in the MVP transformation?
2. What are the three components of the Phong lighting model?
3. Why are triangles used as the fundamental primitive in 3D graphics?
4. What is a G-Buffer and why is it used in deferred rendering?
5. What is the key difference between OpenGL and Vulkan?

---

## Navigation

**Parent**: [[000_GAME_DEV_MOC|GAME-DEV]]

**Synapses**:
- [[001_Game_Loop_And_Engine|GAME-DEV 001]] — Rendering in the loop
- [[002_2D_Graphics_And_Sprites|GAME-DEV 002]] — 2D texture concepts
- [[004_Computer_Architecture|CORE 004]] — GPU architecture
