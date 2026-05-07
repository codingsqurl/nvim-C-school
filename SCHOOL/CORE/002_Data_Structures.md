# 002_Data_Structures

> Arrays, linked lists, stacks, queues, trees, and hash tables with C implementations.

## Level 1 — Intuition

### Concept

A data structure is how you organize data in memory. The structure you pick determines what you can do fast. There are no silver bullets — each structure trades one thing for another.

### The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                  DATA STRUCTURES                         │
├────────────┬───────────┬───────────┬────────────────────┤
│  SEQUENTIAL │  LINKED   │  TREE     │  HASH-BASED       │
│  (contiguous)│(scattered)│(hierarchical)│(key → value)   │
├────────────┼───────────┼───────────┼────────────────────┤
│  Array      │ Linked List│ Binary   │  Hash Table       │
│  Stack      │ Queue     │ Tree     │  Hash Map         │
│  Vector     │ Deque     │ Heap     │  Hash Set         │
└────────────┴───────────┴───────────┴────────────────────┘
```

### Complexity at a Glance

| Structure | Access | Search | Insert | Delete |
|-----------|--------|--------|--------|--------|
| Array | O(1) | O(n) | O(n) | O(n) |
| Linked List | O(n) | O(n) | O(1)* | O(1)* |
| Stack | O(n) | O(n) | O(1) | O(1) |
| Hash Table | N/A | O(1)† | O(1)† | O(1)† |
| BST (balanced) | O(log n) | O(log n) | O(log n) | O(log n) |

\* At known position | † Amortized/average

## Level 2 — Practical

### Dynamic Array (Vector)

```c
#include <stdlib.h>
#include <string.h>

typedef struct {
    int *data;
    size_t size;       // elements in use
    size_t capacity;   // allocated space
} Vector;

Vector vec_new() {
    return (Vector){malloc(sizeof(int) * 4), 0, 4};
}

void vec_push(Vector *v, int value) {
    if (v->size >= v->capacity) {
        v->capacity *= 2;
        v->data = realloc(v->data, sizeof(int) * v->capacity);
    }
    v->data[v->size++] = value;
}

int vec_pop(Vector *v) {
    return (v->size > 0) ? v->data[--v->size] : 0;
}

int vec_get(Vector *v, size_t index) {
    return (index < v->size) ? v->data[index] : 0;
}

void vec_free(Vector *v) {
    free(v->data);
    v->data = NULL;
    v->size = v->capacity = 0;
}
```

### Singly Linked List

```c
#include <stdlib.h>

typedef struct Node {
    int value;
    struct Node *next;
} Node;

// Append to end
Node* list_append(Node *head, int value) {
    Node *new_node = malloc(sizeof(Node));
    new_node->value = value;
    new_node->next = NULL;

    if (!head) return new_node;

    Node *cur = head;
    while (cur->next) cur = cur->next;
    cur->next = new_node;
    return head;
}

// Prepend (fast insert at head)
Node* list_prepend(Node *head, int value) {
    Node *new_node = malloc(sizeof(Node));
    new_node->value = value;
    new_node->next = head;
    return new_node;
}

// Delete first occurrence of value
Node* list_remove(Node *head, int value) {
    if (!head) return NULL;
    if (head->value == value) {
        Node *next = head->next;
        free(head);
        return next;
    }
    Node *cur = head;
    while (cur->next && cur->next->value != value)
        cur = cur->next;
    if (cur->next) {
        Node *to_free = cur->next;
        cur->next = cur->next->next;
        free(to_free);
    }
    return head;
}

void list_free(Node *head) {
    while (head) {
        Node *next = head->next;
        free(head);
        head = next;
    }
}
```

### Stack (LIFO) and Queue (FIFO)

```c
// Stack using dynamic array
typedef struct {
    int *data;
    int top;
    int capacity;
} Stack;

Stack stack_new(int cap) {
    return (Stack){malloc(sizeof(int) * cap), -1, cap};
}
void stack_push(Stack *s, int v) { s->data[++s->top] = v; }
int stack_pop(Stack *s)   { return s->data[s->top--]; }
int stack_peek(Stack *s)  { return s->data[s->top]; }
int stack_empty(Stack *s) { return s->top == -1; }

// Queue using circular buffer
typedef struct {
    int *data;
    int head, tail, size, capacity;
} Queue;

Queue queue_new(int cap) {
    return (Queue){malloc(sizeof(int) * cap), 0, 0, 0, cap};
}
void queue_enqueue(Queue *q, int v) {
    q->data[q->tail] = v;
    q->tail = (q->tail + 1) % q->capacity;
    q->size++;
}
int queue_dequeue(Queue *q) {
    int v = q->data[q->head];
    q->head = (q->head + 1) % q->capacity;
    q->size--;
    return v;
}
int queue_empty(Queue *q) { return q->size == 0; }
```

## Level 3 — Systems

### Binary Search Tree

```c
#include <stdlib.h>

typedef struct TreeNode {
    int value;
    struct TreeNode *left, *right;
} TreeNode;

TreeNode* bst_insert(TreeNode *root, int value) {
    if (!root) {
        TreeNode *n = malloc(sizeof(TreeNode));
        n->value = value;
        n->left = n->right = NULL;
        return n;
    }
    if (value < root->value)
        root->left = bst_insert(root->left, value);
    else if (value > root->value)
        root->right = bst_insert(root->right, value);
    return root;
}

TreeNode* bst_search(TreeNode *root, int value) {
    if (!root || root->value == value) return root;
    return (value < root->value)
        ? bst_search(root->left, value)
        : bst_search(root->right, value);
}

// In-order traversal (sorted if BST)
void bst_inorder(TreeNode *root, void (*visit)(int)) {
    if (!root) return;
    bst_inorder(root->left, visit);
    visit(root->value);
    bst_inorder(root->right, visit);
}
```

### Hash Table (Separate Chaining)

```c
#include <stdlib.h>
#include <string.h>

#define HT_CAPACITY 256

typedef struct HTEntry {
    char *key;
    int value;
    struct HTEntry *next;  // for chaining
} HTEntry;

typedef struct {
    HTEntry *buckets[HT_CAPACITY];
} HashTable;

// Simple DJB2 hash
unsigned int hash(const char *key) {
    unsigned int h = 5381;
    while (*key) h = ((h << 5) + h) + *key++;
    return h % HT_CAPACITY;
}

void ht_insert(HashTable *ht, const char *key, int value) {
    unsigned int idx = hash(key);
    HTEntry *entry = malloc(sizeof(HTEntry));
    entry->key = strdup(key);
    entry->value = value;
    entry->next = ht->buckets[idx];
    ht->buckets[idx] = entry;  // prepend to chain
}

int* ht_get(HashTable *ht, const char *key) {
    unsigned int idx = hash(key);
    for (HTEntry *e = ht->buckets[idx]; e; e = e->next)
        if (strcmp(e->key, key) == 0)
            return &e->value;
    return NULL;
}
```

### Heap (Priority Queue)

```c
// Min-heap: parent always ≤ children
typedef struct {
    int *data;
    int size;
    int capacity;
} MinHeap;

void heap_swap(int *a, int *b) { int t = *a; *a = *b; *b = t; }

void heap_push(MinHeap *h, int value) {
    h->data[h->size] = value;
    int i = h->size++;

    // Bubble up
    while (i > 0 && h->data[i] < h->data[(i - 1) / 2]) {
        heap_swap(&h->data[i], &h->data[(i - 1) / 2]);
        i = (i - 1) / 2;
    }
}

int heap_pop(MinHeap *h) {
    int min = h->data[0];
    h->data[0] = h->data[--h->size];

    // Bubble down
    int i = 0;
    while (1) {
        int smallest = i;
        int left = 2 * i + 1;
        int right = 2 * i + 2;
        if (left < h->size && h->data[left] < h->data[smallest])
            smallest = left;
        if (right < h->size && h->data[right] < h->data[smallest])
            smallest = right;
        if (smallest == i) break;
        heap_swap(&h->data[i], &h->data[smallest]);
        i = smallest;
    }
    return min;
}
```

## Level 4 — Expert

### Self-Balancing Trees (AVL Concept)

```c
// AVL Tree: BST that self-balances with rotations
// Balance factor = height(left) - height(right)
// Rebalance when |balance factor| > 1

int avl_height(TreeNode *n) {
    return n ? 1 + fmax(avl_height(n->left), avl_height(n->right)) : 0;
}

int avl_balance_factor(TreeNode *n) {
    return n ? avl_height(n->left) - avl_height(n->right) : 0;
}

TreeNode* avl_rotate_right(TreeNode *y) {
    TreeNode *x = y->left;
    TreeNode *tmp = x->right;
    x->right = y;
    y->left = tmp;
    return x;  // new root
}

TreeNode* avl_rebalance(TreeNode *root) {
    int bf = avl_balance_factor(root);

    if (bf > 1)   // Left-heavy
        return (avl_balance_factor(root->left) < 0)
            ? (root->left = avl_rotate_right(root->left),
               avl_rotate_right(root))  // LR → LL → Rotate
            : avl_rotate_right(root);   // LL → Rotate

    if (bf < -1)  // Right-heavy
        return (avl_balance_factor(root->right) > 0)
            ? (root->right = avl_rotate_right(root->right),
               avl_rotate_right(root))  // RL → RR → Rotate
            : avl_rotate_right(root);   // RR → Rotate

    return root;
}
```

---

## Exercises

1. Implement a dynamic array (vector) with `push`, `pop`, `get`, and `insert_at` operations. Test with 1000 elements and verify no memory leaks.
2. Build a hash table with separate chaining. Load 10000 random key-value pairs and measure average lookup time.
3. Implement a binary heap (min-heap) and use it to sort an array (heapsort). Compare with your language's built-in sort.

## Quiz

1. When would you choose a linked list over a dynamic array?
2. What's the worst-case time complexity of a hash table lookup, and when does it occur?
3. What property makes a binary tree a "binary search tree"?
4. What's the difference between a stack and a queue?
5. Why do self-balancing trees exist? What problem do they solve?

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[003_Algorithms|CORE 003]] — Algorithms on these structures
- [[001_Mental_Models|CORE 001]] — Mental model of memory layout
- [[005_Operating_Systems|CORE 005]] — OS uses these everywhere
