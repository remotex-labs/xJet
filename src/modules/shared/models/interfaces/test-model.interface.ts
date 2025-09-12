/**
 * Represents a collection of optional options used for test configuration.
 *
 * @property skip - Indicates whether the test should be skipped during execution.
 * @property only - Ensures that only this specific test or set of tests will be run.
 * @property todo - Marks the test as a work-in-progress or not yet implemented.
 * @property failing - Denotes that the test is expected to fail as part of the workflow.
 *
 * @remarks
 * The `TestFlagsType` type is commonly used to specify various states or behaviors for a test case.
 * Each property is optional, and the combination of these options can influence how a test suite operates.
 *
 * @since 1.0.0
 */

export type TestFlagsType = {
    skip?: boolean;
    only?: boolean;
    todo?: boolean;
    failing?: boolean;
};
