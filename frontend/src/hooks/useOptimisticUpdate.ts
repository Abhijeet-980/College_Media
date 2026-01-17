import { useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

interface UseOptimisticUpdateOptions<T> {
    initialState: T;
    updateFn: (newValue: T) => Promise<any>;
    optimisticUpdateFn?: (currentState: T) => T;
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
    errorMessage?: string;
}

interface UpdateQueueItem<T> {
    newValue: T;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
}

const useOptimisticUpdate = <T>({
    initialState,
    updateFn,
    optimisticUpdateFn,
    onSuccess,
    onError,
    errorMessage = 'Update failed. Please try again.'
}: UseOptimisticUpdateOptions<T>) => {
    const [data, setData] = useState<T>(initialState);
    const [isUpdating, setIsUpdating] = useState(false);
    const previousValue = useRef<T>(initialState);
    const updateQueue = useRef<UpdateQueueItem<T>[]>([]);
    const isProcessing = useRef(false);

    // Process queued updates sequentially
    const processQueue = useCallback(async () => {
        if (isProcessing.current || updateQueue.current.length === 0) return;

        isProcessing.current = true;
        const item = updateQueue.current.shift();
        if (!item) {
            isProcessing.current = false;
            return;
        }

        const { newValue, resolve, reject } = item;

        try {
            const result = await updateFn(newValue);

            if (onSuccess) {
                onSuccess(result);
            }

            resolve(result);
        } catch (error) {
            // Rollback on error
            setData(previousValue.current);
            toast.error(errorMessage);

            if (onError) {
                onError(error);
            }

            reject(error);
        } finally {
            setIsUpdating(false);
            isProcessing.current = false;

            // Process next item in queue
            if (updateQueue.current.length > 0) {
                processQueue();
            }
        }
    }, [updateFn, onSuccess, onError, errorMessage]);

    /**
     * Perform optimistic update
     * @param {customValue} [customValue] - Optional custom value (if not using optimisticUpdateFn)
     */
    const optimisticUpdate = useCallback(async (customValue?: T) => {
        // Store current value for potential rollback
        previousValue.current = data;

        // Calculate new optimistic value
        const newValue = customValue !== undefined
            ? customValue
            : optimisticUpdateFn
                ? optimisticUpdateFn(data)
                : data;

        // Apply optimistic update immediately
        setData(newValue);
        setIsUpdating(true);

        // Queue the API call
        return new Promise((resolve, reject) => {
            updateQueue.current.push({ newValue, resolve, reject });
            processQueue();
        });
    }, [data, optimisticUpdateFn, processQueue]);

    /**
     * Manually rollback to previous value
     */
    const rollback = useCallback(() => {
        setData(previousValue.current);
        setIsUpdating(false);
    }, []);

    /**
     * Reset to initial state
     */
    const reset = useCallback(() => {
        setData(initialState);
        previousValue.current = initialState;
        setIsUpdating(false);
        updateQueue.current = [];
        isProcessing.current = false;
    }, [initialState]);

    return {
        data,
        isUpdating,
        optimisticUpdate,
        rollback,
        reset
    };
};

export default useOptimisticUpdate;

/**
 * Example Usage:
 * 
 * // In a component
 * const { data: likes, isUpdating, optimisticUpdate } = useOptimisticUpdate({
 *   initialState: post.likes,
 *   updateFn: async (newLikes) => {
 *     const response = await api.likePost(postId, newLikes);
 *     return response.data.likes;
 *   },
 *   optimisticUpdateFn: (currentLikes) => currentLikes + 1,
 *   onSuccess: () => console.log('Like successful!'),
 *   errorMessage: 'Failed to like post'
 * });
 * 
 * const handleLike = () => {
 *   optimisticUpdate(); // Instant UI update
 * };
 * 
 * // With custom value
 * const handleToggleLike = () => {
 *   const newValue = isLiked ? likes - 1 : likes + 1;
 *   optimisticUpdate(newValue);
 * };
 */
