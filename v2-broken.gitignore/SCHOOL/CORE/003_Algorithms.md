# 003_Algorithms

> Sorting, searching, Big O notation, recursion, and dynamic programming.

## Level 1 — Intuition

### Concept

An algorithm is a step-by-step recipe for solving a problem. Good algorithms scale gracefully — a 10x bigger input doesn't mean 10x slower execution.

### Big O: The Scaling Vocabulary

```
O(1)      Constant    "Same speed no matter what"         Array access
O(log n)  Logarithmic "Slows down amazing slowly"         Binary search
O(n)     Linear      "Double input = double time"         Linear search
O(n log n) Linearithmic "A bit worse than linear"         Merge sort
O(n²)    Quadratic   "Double input = quadruple time"      Bubble sort
O(2ⁿ)    Exponential "Add one input = double time"        Recursive Fibonacci

Visualized (n = input size, time on y-axis):
O(1):     ────────────────────── (flat line)
O(log n): ╭────────────────────  (quickly flattens)
O(n):     ╱ (straight diagonal)
O(n²):    ╱╱ (curves upward hard)
```

## Level 2 — Practical

### Searching

```c
// Linear Search — O(n)
int linear_search(int arr[], int n, int target) {
    for (int i = 0; i < n; i++)
        if (arr[i] == target) return i;
    return -1;
}

// Binary Search — O(log n) — requires sorted array!
int binary_search(int arr[], int left, int right, int target) {
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target)
            left = mid + 1;
        else
            right = mid - 1;
    }
    return -1;
}
```

### Sorting

```c
// Quick Sort — O(n log n) average, O(n²) worst
int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] <= pivot) {
            i++;
            int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
        }
    }
    int tmp = arr[i + 1]; arr[i + 1] = arr[high]; arr[high] = tmp;
    return i + 1;
}

void quick_sort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quick_sort(arr, low, pi - 1);
        quick_sort(arr, pi + 1, high);
    }
}

// Merge Sort — guaranteed O(n log n)
void merge(int arr[], int left, int mid, int right) {
    int n1 = mid - left + 1, n2 = right - mid;
    int *L = malloc(n1 * sizeof(int));
    int *R = malloc(n2 * sizeof(int));
    for (int i = 0; i < n1; i++) L[i] = arr[left + i];
    for (int i = 0; i < n2; i++) R[i] = arr[mid + 1 + i];

    int i = 0, j = 0, k = left;
    while (i < n1 && j < n2)
        arr[k++] = (L[i] <= R[j]) ? L[i++] : R[j++];
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
    free(L); free(R);
}

void merge_sort(int arr[], int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        merge_sort(arr, left, mid);
        merge_sort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}
```

### Recursion

```c
// Recursion = function calls itself with smaller input
// Two requirements: base case (stop) and recursive case (shrink)

// Factorial: n! = n * (n-1)!
int factorial(int n) {
    if (n <= 1) return 1;              // Base case
    return n * factorial(n - 1);      // Recursive case
}

// Fibonacci: F(n) = F(n-1) + F(n-2)
// WARNING: This naive version is O(2ⁿ) — DO NOT USE
int fib_naive(int n) {
    if (n <= 1) return n;
    return fib_naive(n - 1) + fib_naive(n - 2);
}

// Fibonacci with memoization — O(n)
#define MAX_FIB 100
int memo[MAX_FIB] = {0};

int fib_memo(int n) {
    if (n <= 1) return n;
    if (memo[n]) return memo[n];
    memo[n] = fib_memo(n - 1) + fib_memo(n - 2);
    return memo[n];
}
```

## Level 3 — Systems

### Dynamic Programming

```c
// DP = break problem into overlapping subproblems, cache results

// 0/1 Knapsack: max value with weight limit
// items[i] = {weight, value}, capacity = W
int knapsack(int weights[], int values[], int n, int W) {
    int dp[n + 1][W + 1];

    for (int i = 0; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (i == 0 || w == 0)
                dp[i][w] = 0;
            else if (weights[i - 1] <= w)
                dp[i][w] = fmax(
                    values[i - 1] + dp[i - 1][w - weights[i - 1]],
                    dp[i - 1][w]
                );
            else
                dp[i][w] = dp[i - 1][w];
        }
    }
    return dp[n][W];
}

// Longest Common Subsequence (LCS)
int lcs(char *a, char *b) {
    int m = strlen(a), n = strlen(b);
    int dp[m + 1][n + 1];
    memset(dp, 0, sizeof(dp));

    for (int i = 1; i <= m; i++)
        for (int j = 1; j <= n; j++)
            dp[i][j] = (a[i-1] == b[j-1])
                ? dp[i-1][j-1] + 1
                : fmax(dp[i-1][j], dp[i][j-1]);

    return dp[m][n];
}
```

### Graph Algorithms

```c
// BFS — shortest path in unweighted graph
// Uses queue from data structures lesson
void bfs(int graph[][MAX_NODES], int start, int n) {
    int visited[MAX_NODES] = {0};
    int queue[MAX_NODES], front = 0, rear = 0;

    visited[start] = 1;
    queue[rear++] = start;

    while (front < rear) {
        int node = queue[front++];
        printf("Visited: %d\n", node);

        for (int neighbor = 0; neighbor < n; neighbor++) {
            if (graph[node][neighbor] && !visited[neighbor]) {
                visited[neighbor] = 1;
                queue[rear++] = neighbor;
            }
        }
    }
}

// DFS — explore deeply first (recursive)
void dfs(int graph[][MAX_NODES], int node, int visited[], int n) {
    visited[node] = 1;
    printf("Visited: %d\n", node);
    for (int i = 0; i < n; i++)
        if (graph[node][i] && !visited[i])
            dfs(graph, i, visited, n);
}
```

## Level 4 — Expert

### Algorithm Design Patterns

```
1. Divide and Conquer
   Split problem → solve sub-problems → combine
   Examples: Merge Sort, Quick Sort, Binary Search

2. Greedy
   Make locally optimal choice at each step
   Examples: Dijkstra's, Huffman coding, Kruskal's MST
   Warning: Doesn't always give optimal global solution

3. Dynamic Programming
   Overlapping subproblems + optimal substructure
   Top-down (memoization) or Bottom-up (tabulation)
   Examples: Knapsack, LCS, Edit Distance, Coin Change

4. Backtracking
   Explore all possibilities, prune bad paths early
   Examples: N-Queens, Sudoku solver, graph coloring

5. Sliding Window
   Maintain window over array, slide as needed
   Examples: Max subarray, longest substring without repeats

6. Two Pointers
   Start from ends or different positions, converge
   Examples: Sorted array pair sum, palindrome check
```

### Sorting Algorithm Comparison

| Algorithm | Best | Average | Worst | Space | Stable |
|-----------|------|---------|-------|-------|--------|
| Bubble | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Insertion | O(n) | O(n²) | O(n²) | O(1) | Yes |
| Selection | O(n²) | O(n²) | O(n²) | O(1) | No |
| Merge | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes |
| Quick | O(n log n) | O(n log n) | O(n²) | O(log n) | No |
| Heap | O(n log n) | O(n log n) | O(n log n) | O(1) | No |

---

## Exercises

1. Implement binary search on a sorted array. Compare the number of steps vs linear search for an array of 1,000,000 elements.
2. Write an iterative (bottom-up) Fibonacci function, a recursive one, and a memoized one. Benchmark all three for n=40.
3. Solve the Coin Change problem with DP: given coins [1,5,10,25], find minimum coins to make amount N.

## Quiz

1. What does O(n log n) mean? Give an example algorithm.
2. Why is naive recursive Fibonacci O(2ⁿ)?
3. What's the difference between memoization and tabulation?
4. When would you use BFS instead of DFS on a graph?
5. Why might Quick Sort be preferred over Merge Sort despite its worse worst-case?

---

## Navigation

**Parent**: [[000_CORE_MOC|CORE]]

**Synapses**:
- [[002_Data_Structures|CORE 002]] — Structures algorithms operate on
- [[001_Mental_Models|CORE 001]] — Problem decomposition
- [[006_Compilers_And_Interpreters|CORE 006]] — Parsing algorithms
